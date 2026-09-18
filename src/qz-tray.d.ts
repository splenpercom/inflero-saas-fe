declare module "qz-tray" {
  // QZ Tray ships without TypeScript types; runtime API is dynamic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qz: any;
  export default qz;
}
