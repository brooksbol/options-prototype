#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {showFieldManual} from './ww-show-fields.mjs';
const url=new URL('../docs/cli/ww-show-man.txt',import.meta.url);
const begin='PUBLIC FIELDS (generated from the authoritative projection registry)\n',end='END PUBLIC FIELDS\n';
const source=await readFile(url,'utf8');
const start=source.indexOf(begin),finish=source.indexOf(end);
if(start<0||finish<start)throw Error('show manual field block missing');
const expected=source.slice(0,start+begin.length)+showFieldManual()+'\n'+source.slice(finish);
if(process.argv.includes('--check')){if(source!==expected)throw Error('show manual out of sync with projection registry');console.log('show registry/manual field semantics are synchronized');}
else await writeFile(url,expected);
