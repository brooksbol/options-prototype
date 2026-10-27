import '../privacy.mjs';
import { writeFileSync } from 'node:fs';
import { connectSyntheticMcp } from '../synthetic.mjs';
import { existingBackendToken } from '../server.mjs';
import assert from 'node:assert/strict';
if (!process.argv[2]) throw new Error('Supply a local redacted evidence output path before execution.');
import { createConversation } from '../conversation.mjs';
import { RunContext } from '@openai/agents';
// Existing operational held evidence, MCP only; never send results to a model.
// No provider refresh, grant bootstrap, installation or protected Account access.
const servers = await connectSyntheticMcp({ base:'http://127.0.0.1:3100', token:existingBackendToken() },
  [{name:'retained-market-audit',script:'../mcp-v2-evidence/server.mjs',admitted:['inspect_market_quotes']}]);
try {
  const tools=await servers[0].listTools();
  assert.ok(tools.some(tool=>tool.name==='inspect_market_quotes'));
  const chat=createConversation({servers,model:{getResponse(){throw new Error('No model request authorized in this diagnostic.');}}});
  assert.deepEqual((await chat.agent.getAllTools(new RunContext({}))).map(tool=>tool.name),['inspect_market_quotes']);
  const discovery=await servers[0].callToolResult('inspect_market_quotes',{});
  assert.notEqual(discovery.isError,true);
  const inventory=JSON.parse(discovery.content[0].text);
  const types={};for(const item of inventory.evidence.items)types[item.subject.securityType]=(types[item.subject.securityType]??0)+1;
  const subject=inventory.evidence.items[0].subject.symbol;
  const observation=await servers[0].callToolResult('inspect_market_quotes',{symbol:subject});
  assert.notEqual(observation.isError,true);
  const candidate=await servers[0].callToolResult('inspect_market_quotes',{symbol:subject,measurement:true});
  const problem=JSON.parse(candidate.content[0].text);
  assert.equal(candidate.isError,true);assert.equal(problem.code,'NOT_FOUND');
  const result={actualMcpDiscovery:true,realRetainedObservationRead:true,modelRequests:0,
    quoteDiscoveryCount:inventory.evidence.items.length,types,
    candidateSubresourceInstalled:false,existingRuntimeCandidateRead:{code:problem.code,requestId:problem.requestId},
    retainedObservationRequestId:JSON.parse(observation.content[0].text).requestId,
    providerAcquisition:false, protectedFinancialValuesExported:false};
  writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
} finally { await servers[0].close(); }
