"""Entire prespecified matrix, paired controls, chronology, sensitivities and plots."""
import argparse
from dataclasses import asdict, replace
import hashlib
import itertools
import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from data import ROOT,load
from engine import Config,simulate,metrics

PRICES=[.05,.06,.07,.08,.10,.12]
VOLS=[.20,.35,.50,.65,.80]
RECOVER=[.25,.50,.75]
WINDOWS={
 'grinding_2008':('2007-07-01','2009-06-30'),
 'crash_2020':('2020-02-01','2020-04-30'),
 'v_recovery_2020':('2020-03-01','2020-12-31'),
 'chop_2014_16':('2014-01-01','2016-12-31'),
 'bull_2017':('2017-01-01','2017-12-31'),
 'grinding_2022':('2022-01-01','2022-12-31'),
 'bull_2023_24':('2023-01-01','2024-12-31'),
}

def configurations():
    allconfigs={'benchmark_A':Config(mode='buyhold'),'benchmark_B':Config(mode='hold300'),'slow':Config(mode='slow')}
    for p,v,pr,vr in itertools.product(PRICES,VOLS,RECOVER,RECOVER):
        allconfigs[f'D_p{p:.2f}_v{v:.2f}_r{pr:.2f}_n{vr:.2f}']=Config(price=p,vol=v,recover_price=pr,recover_vol=vr)
    for p,pr in itertools.product(PRICES,RECOVER):
        allconfigs[f'P_p{p:.2f}_r{pr:.2f}']=Config(price=p,recover_price=pr,require_vol=False)
    return allconfigs

ILLUSTRATION='D_p0.06_v0.50_r0.50_n0.50'
PRICE_CONTROL='P_p0.06_r0.50'


def csv(df,path):
    df.to_csv(path,index=False,float_format='%.9g')


def save_logs(name,d,t,s,out):
    logdir=out/'logs';logdir.mkdir(exist_ok=True)
    for label,frame in [('daily',d.reset_index()),('trades',t),('states',s.reset_index())]:
        frame.to_csv(logdir/(name+'_'+label+'.csv.gz'),index=False,float_format='%.9g',compression={'method':'gzip','mtime':0})


def neighboring(matrix):
    candidates=matrix[matrix.id.str.startswith('D_')].copy()
    keys=['price','vol','recover_price','recover_vol']
    lookup={tuple(row[k] for k in keys):row for _,row in candidates.iterrows()}
    rows=[]
    grids=[PRICES,VOLS,RECOVER,RECOVER]
    for _,row in candidates.iterrows():
        point=tuple(row[k] for k in keys); peers=[]
        for axis,grid in enumerate(grids):
            index=min(range(len(grid)),key=lambda i:abs(grid[i]-point[axis]))
            for neighbor in [index-1,index+1]:
                if 0<=neighbor<len(grid):
                    q=list(point);q[axis]=grid[neighbor];peers.append(lookup[tuple(q)])
        passes=[r.test_max_drawdown>=-.15 and r.test_upside_capture>=.8 for r in peers]
        rows.append({'id':row.id,'neighbors':len(peers),'neighbor_joint_pass_fraction':np.mean(passes),
                     'neighbor_cagr_range':max(r.test_cagr for r in peers)-min(r.test_cagr for r in peers),
                     'neighbor_drawdown_range':max(r.test_max_drawdown for r in peers)-min(r.test_max_drawdown for r in peers)})
    return pd.DataFrame(rows)


def figures(curves,matrix,regimes,states,out):
    names=['benchmark_A','benchmark_B','slow',PRICE_CONTROL,ILLUSTRATION]
    labels=['A: fully invested','B: passive300','C: slow only','D: price only6/50','D: price+RVX6/50/50/50']
    fig,axes=plt.subplots(3,1,figsize=(13,10),sharex=True)
    for name,label in zip(names,labels):
        d=curves[name]
        axes[0].plot(d.index,d.nav,label=label,lw=1.2)
        dd=d.nav/d.nav.cummax()-1
        axes[1].plot(d.index,dd*100,lw=1)
        axes[2].plot(d.index,d.exposure*100,lw=1)
    axes[0].set(ylabel='Portfolio value ($)',title='Historical Test1 — $100,000, zero cash yield, next-session opens')
    axes[1].set(ylabel='Drawdown (%)');axes[2].set(ylabel='Equity allocation (%)')
    axes[0].legend(fontsize=8,ncol=2)
    for ax in axes:ax.grid(alpha=.2)
    fig.tight_layout();fig.savefig(out/'equity_drawdown_exposure.png',dpi=150);plt.close(fig)
    v=matrix[matrix.id.str.startswith('D_')]
    fig,axes=plt.subplots(1,3,figsize=(13,4))
    for ax,col,label in zip(axes,['test_cagr','test_max_drawdown','test_upside_capture'],['OOS CAGR(%)','OOS drawdown(%)','OOS upside capture(%)']):
        ax.hist(v[col]*100,bins=25,alpha=.8);ax.set(title=label,ylabel='Configurations')
    axes[1].axvline(-15,color='red',ls='--');axes[2].axvline(80,color='red',ls='--')
    fig.tight_layout();fig.savefig(out/'robustness_distributions.png',dpi=150);plt.close(fig)
    fig,axes=plt.subplots(1,2,figsize=(12,4))
    for ax,col,title in zip(axes,['test_max_drawdown','test_upside_capture'],['OOS drawdown median over recovery thresholds','OOS upside capture median over recovery thresholds']):
        pivot=v.pivot_table(index='vol',columns='price',values=col,aggfunc='median')*100
        im=ax.imshow(pivot,aspect='auto',origin='lower',cmap='viridis')
        ax.set_xticks(range(len(PRICES)),[f'{x:.0%}' for x in PRICES]);ax.set_yticks(range(len(VOLS)),[f'{x:.0%}' for x in VOLS])
        ax.set(xlabel='5-session decline',ylabel='5-session RVX expansion',title=title)
        fig.colorbar(im,ax=ax,label='%')
    fig.tight_layout();fig.savefig(out/'parameter_heatmaps.png',dpi=150);plt.close(fig)
    s=states.loc['2020-02-01':'2020-12-31']; d=curves[ILLUSTRATION].reindex(s.index)
    fig,axes=plt.subplots(3,1,figsize=(12,7),sharex=True)
    axes[0].plot(s.index,s.close,color='black');axes[0].set(ylabel='Causal IWM index',title='Fixed illustration: 2020 signal/actual-holding timeline')
    axes[1].step(s.index,s.new_state.map(lambda x:int(x[1])),label='Slow level',where='post')
    axes[1].step(s.index,s.new_state.map(lambda x:int(x[-1])),label='Fast veto',where='post');axes[1].legend()
    axes[2].step(d.index,d.shares,where='post');axes[2].set(ylabel='Actual shares')
    fig.tight_layout();fig.savefig(out/'state_timeline_2020.png',dpi=150);plt.close(fig)


def run():
    out=ROOT/'results';out.mkdir(exist_ok=True)
    source=load();validation=json.loads((ROOT/'data/validation.json').read_text());start=validation['simulation_start']
    configs=configurations();summary=[];regimes=[];curves={};selection_rows=[];events=[]
    b,bt,bs=simulate(source,configs['benchmark_A'],start=start)
    years=list(range(2016,source.index[-1].year+1))
    training_scores={year:[] for year in years}
    for index,(name,cfg) in enumerate(configs.items()):
        d,t,s=simulate(source,cfg,start=start)
        save_logs(name,d,t,s,out)
        row={'id':name,**asdict(cfg),**metrics(d,t,b)}
        for prefix,a,z in [('train',None,'2015-12-31'),('test','2016-01-01',None)]:
            row.update({prefix+'_'+k:v for k,v in metrics(d,t,b,slice_start=a,slice_end=z).items()})
        summary.append(row)
        for regime,(a,z) in WINDOWS.items():
            mm=metrics(d,t,b,slice_start=a,slice_end=z)
            regimes.append({'id':name,'regime':regime,'start':a,'end':z,**mm})
        if name.startswith('D_'):
            for year in years:
                mm=metrics(d,t,b,slice_end=f'{year-1}-12-31')
                # Target distance, not maximum-return winner. Historical targets remain hypotheses.
                score=max(0,(-mm['max_drawdown']-.15)) + max(0,.8-mm['upside_capture'])
                training_scores[year].append((score,mm['whipsaw_count'],name,mm))
        if name in ['benchmark_A','benchmark_B','slow',ILLUSTRATION,PRICE_CONTROL]:
            curves[name]=d
            csv(t,out/(name+'_trades.csv'));csv(s.reset_index(),out/(name+'_states.csv'));csv(d.reset_index(),out/(name+'_daily.csv'))
            if name==ILLUSTRATION:illustration_states=s
            # Every diagnostic fast event: timing, same-five-day trough and next open loss.
            for date,event in s[s.reason.str.contains('fast_crash')].iterrows():
                pos=source.index.get_loc(date)
                if pos+1>=len(source):continue
                nxt=source.iloc[pos+1]
                events.append({'id':name,'signal_date':date,'execution_date':source.index[pos+1],
                               'signal_price5':event.price5,'signal_rvx5':event.rvx5,
                               'signal_slow_level':int(event.new_state[1]),
                               'next_open_vs_signal_close':nxt.open/source.loc[date,'close']-1,
                               'next_open_vs_precrash_raw_close':nxt.open/source.iloc[pos-5].close-1,
                               'actual_A_at_signal':event.actual_A})
        if index%30==0:print(f'matrix {index+1}/{len(configs)}',flush=True)
    matrix=pd.DataFrame(summary)
    csv(matrix,out/'parameter_matrix.csv');csv(pd.DataFrame(regimes),out/'regime_matrix.csv')
    csv(neighboring(matrix),out/'neighbor_robustness.csv');csv(pd.DataFrame(events),out/'fast_event_diagnostics.csv')
    schedule={};folds=[]
    for year in years:
        score,whip,name,mm=min(training_scores[year],key=lambda x:x[:3])
        schedule[year]=configs[name]
        selection_rows.append({'test_year':year,'training_end':f'{year-1}-12-31','selected_id':name,'score':score,'training_whipsaws':whip,
                              **{'training_'+k:v for k,v in mm.items()}})
        # Independent fold accounts expose starting-allocation dependency. No splice of NAV paths.
        for foldname,foldcfg in [('selected',configs[name]),('benchmark_A',configs['benchmark_A']),('benchmark_B',configs['benchmark_B']),('slow',configs['slow'])]:
            fd,ft,fs=simulate(source,foldcfg,start=f'{year}-01-01',end=f'{year}-12-31')
            fb,fbt,_=simulate(source,configs['benchmark_A'],start=f'{year}-01-01',end=f'{year}-12-31')
            folds.append({'year':year,'policy':foldname,'selected_id':name,**metrics(fd,ft,fb)})
    csv(pd.DataFrame(selection_rows),out/'walkforward_selections.csv');csv(pd.DataFrame(folds),out/'walkforward_folds.csv')
    # One actual continuous walk-forward portfolio from2016. Defer new parameters until both vetoes clear.
    wd,wt,ws=simulate(source,configs[selection_rows[0]['selected_id']],start='2016-01-01',schedule=schedule)
    wb,wbt,_=simulate(source,configs['benchmark_A'],start='2016-01-01')
    save_logs('walkforward',wd,wt,ws,out);csv(wd.reset_index(),out/'walkforward_daily.csv')
    csv(pd.DataFrame([{'id':'walkforward',**metrics(wd,wt,wb)},{'id':'benchmark_A_2016',**metrics(wb,wbt,wb)}]),out/'walkforward_summary.csv')
    sensitivity=[]
    base=configs[ILLUSTRATION]
    variants={'baseline':base,'frictionless':replace(base,slippage=0,fee_share=0),
              'cost20bp':replace(base,slippage=.002,fee_share=.01),'one_block_R2':replace(base,recovery2_one=True),
              'persistent_bear':replace(base,persistent_bear=True),'fast_confirm1':replace(base,fast_confirm=1),
              'fast_confirm3':replace(base,fast_confirm=3),'dividend_delay0':replace(base,dividend_delay=0),
              'dividend_delay14':replace(base,dividend_delay=14),'cash_yield2':replace(base,cash_yield=.02),
              'cash_yield4':replace(base,cash_yield=.04)}
    for variant,cfg in variants.items():
        # All comparators have matching costs/dividend timing/cash yield.
        paired_b,pbt,_=simulate(source,replace(configs['benchmark_A'],slippage=cfg.slippage,fee_share=cfg.fee_share,dividend_delay=cfg.dividend_delay,cash_yield=cfg.cash_yield),start=start)
        for name,policy in [('illustration',cfg),('slow',replace(cfg,mode='slow')),('price_only',replace(cfg,require_vol=False)),('benchmark_A',replace(cfg,mode='buyhold')),('benchmark_B',replace(cfg,mode='hold300'))]:
            sd,st,ss=simulate(source,policy,start=start)
            save_logs('sensitivity_'+variant+'_'+name,sd,st,ss,out)
            sensitivity.append({'variant':variant,'policy':name,**metrics(sd,st,paired_b),
                                **{'test_'+k:v for k,v in metrics(sd,st,paired_b,slice_start='2016-01-01').items()}})
    csv(pd.DataFrame(sensitivity),out/'sensitivities.csv')
    # Per-candidate matched price-only comparison; recovery-vol is absent in price-only, deliberately many-to-one.
    paired=[]
    for _,r in matrix[matrix.id.str.startswith('D_')].iterrows():
        p=matrix[matrix.id==f'P_p{r.price:.2f}_r{r.recover_price:.2f}'].iloc[0]
        paired.append({'id':r.id,'price_only_id':p.id,
                       **{'test_delta_'+k:r['test_'+k]-p['test_'+k] for k in ['cagr','max_drawdown','upside_capture','tactical_exits','whipsaw_count']}})
    csv(pd.DataFrame(paired),out/'volatility_paired.csv')
    cohorts=[]
    for cohort_start in [start,'2010-01-01','2015-01-01','2020-01-01','2025-01-01']:
        cb,cbt,_=simulate(source,configs['benchmark_A'],start=cohort_start)
        for name in ['benchmark_A','benchmark_B','slow',PRICE_CONTROL,ILLUSTRATION]:
            cd,ct,cs=simulate(source,configs[name],start=cohort_start)
            cohorts.append({'id':name,'cohort_start':cohort_start,'initial_equity_fraction':cd.shares.iloc[0]*source.loc[cd.index[0],'open']/100000,**metrics(cd,ct,cb)})
    csv(pd.DataFrame(cohorts),out/'start_date_diagnostics.csv')
    figures(curves,matrix,pd.DataFrame(regimes),illustration_states,out)
    run_manifest={'config_count':len(configs),'baseline_configs':{k:asdict(v) for k,v in configs.items()},
                  'data_sha256':validation['normalized_sha256'],'start':start,'end':str(source.index[-1].date()),
                  'training_end':'2015-12-31','fixed_illustration':ILLUSTRATION,
                  'code_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'code').glob('*.py')}}
    (out/'run_manifest.json').write_text(json.dumps(run_manifest,indent=2)+'\n')
    print('complete',len(configs),flush=True)

if __name__=='__main__':run()
