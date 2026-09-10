declare const __PACKAGE_VERSION__: string | undefined;

/**
 * Current package version, synchronized automatically with package.json at build and test time.
 */
export const VERSION: string =
  typeof __PACKAGE_VERSION__ !== 'undefined' ? __PACKAGE_VERSION__ : '1.0.0';
