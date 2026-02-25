export function buildProvenanceRecord({ objectRecord, userPrompt, responseText, model, sources }) {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    objectId: objectRecord.id,
    model,
    input: {
      prompt: userPrompt,
      verifiedFactsCount: objectRecord.verifiedFacts?.length || 0,
      unknownFieldsCount: objectRecord.unknownFields?.length || 0,
      prohibitedStatementsCount: objectRecord.prohibitedStatements?.length || 0,
    },
    output: {
      responseText,
      charCount: responseText.length,
    },
    sources: sources || [
      { type: 'collectiveaccess', id: objectRecord.source?.collectiveAccessId },
      { type: 'resourcespace', id: objectRecord.source?.resourceSpaceId },
    ],
  };
}
