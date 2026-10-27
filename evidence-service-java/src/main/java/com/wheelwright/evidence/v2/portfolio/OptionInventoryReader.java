package com.wheelwright.evidence.v2.portfolio;

import com.wheelwright.evidence.v2.*;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;

/** A bounded custody query, not a strategy recognizer or a collateral engine. */
@Component
public final class OptionInventoryReader {
    public record Source(String snapshotId,String artifactId,String observationDate,String receivedAt,
                         String clockQualification,List<Integer> sourceRows) {}
    public record RelatedLong(String sourceHoldingKey,String sourceIdentifier,String right,String expiration,
                              BigDecimal strike,BigDecimal quantity,String associationStatus) {}
    public record Row(String sourceHoldingKey,String sourceIdentifier,String underlyingSymbol,String right,
                      String expiration,BigDecimal strike,BigDecimal quantity,String side,String unit,
                      String termsStatus,String constructionStatus,List<RelatedLong> relatedLongOptions,Source source) {}
    public record AccountResult(String accountId,String nickname,String broker,String status,boolean readComplete,
                                String snapshotCoverage,List<Row> options,List<Row> unclassifiedOptions) {}
    public record Counts(BigDecimal shortPutContracts,BigDecimal longPutContracts,BigDecimal shortCallContracts,
                         BigDecimal longCallContracts,int unclassifiedOptionHoldings,boolean selectedInventoryComplete,
                         BigDecimal cashSecuredPutContracts,String cashSecuredPutStatus) {}
    public record Read(String requestId,String selection,String right,String side,List<AccountResult> accounts,
                       Counts counts,String currentness,List<String> qualifications) {}
    private final PortfolioRepository repository;
    private final PortfolioSources sources;
    private final AccountDirectory accounts;
    private static final Pattern SERIES=Pattern.compile("-?([A-Z0-9./^]+)\\s*(\\d{6})([CP])(\\d+(?:\\.\\d+)?)");

    public OptionInventoryReader(PortfolioRepository repository,PortfolioSources sources,AccountDirectory accounts) {
        this.repository=repository;this.sources=sources;this.accounts=accounts;
    }
    public Read read(String accountId,String right,String side,String requestId,BearerAuthenticator.Principal caller)throws Exception {
        var selected=accounts.list().stream().filter(a->caller.hasGrant("account.read:"+a.id()))
                .filter(a->accountId==null||accountId.equals(a.id())).toList();
        if(selected.size()>100)throw new IllegalStateException("inventory scope capacity");
        var results=new ArrayList<AccountResult>();
        var sums=new HashMap<String,BigDecimal>();int unknown=0;boolean complete=true;
        for(var account:selected) {
            if(!caller.hasGrant("account.holdings.read:"+account.id())) {
                results.add(new AccountResult(account.id(),account.alias(),account.brokerAssociation().broker(),
                        "FORBIDDEN",false,"UNKNOWN",List.of(),List.of()));complete=false;continue;
            }
            var snapshot=new PortfolioSnapshots(repository).current(account.id());
            if(snapshot.isEmpty()) {
                results.add(new AccountResult(account.id(),account.alias(),account.brokerAssociation().broker(),
                        "NO_RETAINED_CUSTODY",true,"UNKNOWN",List.of(),List.of()));continue;
            }
            var cut=snapshot.get();if(cut.holdings().size()>1000)throw new IllegalStateException("inventory row capacity");
            var all=new ArrayList<Row>();
            try(var connection=repository.connection()) {
                for(var holding:cut.holdings()) {
                    if(!holding.kind().equals("Options"))continue;
                    var terms=sources.partialTerms(holding);
                    var match=SERIES.matcher(holding.contract().strip());
                    String underlying=match.matches()?match.group(1):null;
                    String observedDate=cut.observation()==null?cut.evidenceDate():null;
                    var source=new Source(cut.snapshotId(),cut.artifactId(),observedDate,cut.recordedAt(),
                            cut.observation()==null?"FIDELITY_EXPORT_DAY":"BACKEND_RECEIPT_NOT_OBSERVATION",holding.sourceRows());
                    all.add(new Row(holding.holdingId(),holding.contract(),underlying,terms.path("right").asText("UNKNOWN"),
                            terms.path("expiration").isTextual()?terms.path("expiration").asText():null,
                            terms.path("strike").isTextual()?new BigDecimal(terms.path("strike").asText()):null,
                            holding.quantity().abs(),holding.quantity().signum()<0?"SHORT":"LONG","CONTRACT",
                            terms.path("qualification").asText(),"NOT_ESTABLISHED_BY_CUSTODY",List.of(),source));
                }
            }
            var matches=new ArrayList<Row>();var unclassified=new ArrayList<Row>();
            for(var row:all) {
                if(side!=null&&!side.equals(row.side()))continue;
                if(row.right().equals("UNKNOWN")){unclassified.add(row);unknown++;complete=false;continue;}
                if(right!=null&&!right.equals(row.right()))continue;
                var related=new ArrayList<RelatedLong>();
                if(row.side().equals("SHORT")&&row.underlyingSymbol()!=null&&row.expiration()!=null)for(var other:all) {
                    if(other.side().equals("LONG")&&other.right().equals(row.right())&&row.underlyingSymbol().equals(other.underlyingSymbol())&&row.expiration().equals(other.expiration()))
                        related.add(new RelatedLong(other.sourceHoldingKey(),other.sourceIdentifier(),other.right(),other.expiration(),other.strike(),other.quantity(),"CONTEXT_ONLY_NOT_CONSTRUCTION_MEMBERSHIP"));
                }
                matches.add(new Row(row.sourceHoldingKey(),row.sourceIdentifier(),row.underlyingSymbol(),row.right(),row.expiration(),row.strike(),row.quantity(),row.side(),row.unit(),row.termsStatus(),row.constructionStatus(),List.copyOf(related),row.source()));
                sums.merge(row.side()+"_"+row.right(),row.quantity(),BigDecimal::add);
            }
            results.add(new AccountResult(account.id(),account.alias(),account.brokerAssociation().broker(),"READ",true,
                    cut.excludedNonPositionRows()>0?"PARTIAL":"COMPLETE_REPORTED",List.copyOf(matches),List.copyOf(unclassified)));
        }
        var counts=new Counts(sums.getOrDefault("SHORT_PUT",BigDecimal.ZERO),sums.getOrDefault("LONG_PUT",BigDecimal.ZERO),
                sums.getOrDefault("SHORT_CALL",BigDecimal.ZERO),sums.getOrDefault("LONG_CALL",BigDecimal.ZERO),unknown,complete,null,"NOT_ESTABLISHED_BY_INVENTORY_READ");
        return new Read(requestId,accountId==null?"ALL_METADATA_AUTHORIZED_ACCOUNTS":"EXPLICIT_ACCOUNT",right,side,List.copyOf(results),counts,"NOT_ESTABLISHED",List.of(
                "Authorized visibility is not proof of ownership or complete brokerage coverage.",
                "Counts cover the returned matched options in each Account's existing backend-selected retained custody cut, not live brokerage completeness.",
                "A short put is not a verified cash-secured put. This read does not establish collateral, construction membership, Account strategy permission or governed capital availability.",
                "Related long options are same-Account, same-source-cut, underlying/right/expiration context only. Geometry alone does not establish a spread or constituent membership.",
                "Unknown option rights and denied Accounts remain explicit; an incomplete count is not an exact portfolio total. Other construction evidence may exist independently.",
                "Fidelity dates are source export days. Tastytrade receipt dates are not source observation clocks. Partial snapshot coverage remains qualified."));
    }
}
