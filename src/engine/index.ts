// Public surface of the polarity engine. The UI imports from here only.
export * from './types';
export { evaluateLink, aggregate } from './evaluate';
export { suggestFixes, type Fix } from './fixes';
export { checkInterop, scopeIssues, type InteropResult } from './interop';
export { METHOD_NAMES, detectMethod } from './methods';
export { resolveLink, defaultPolish, UnknownComponentError } from './resolve';
export { trace, type Source } from './trace';
