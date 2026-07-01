// Registers an ESM resolve hook that maps the `server-only` / `client-only`
// import guards to an empty module, so server modules can be exercised by
// node-run self-checks outside the Next.js runtime.
import { register } from "node:module";

const loader = `
export async function resolve(specifier, context, next) {
  if (specifier === 'server-only' || specifier === 'client-only') {
    return { url: 'data:text/javascript,export default {}', shortCircuit: true };
  }
  return next(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url);
