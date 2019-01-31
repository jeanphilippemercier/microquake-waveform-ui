// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // URL of development API
  apiUrlCatalog: 'http://sppkube.eastus.cloudapp.azure.com/api/v1/catalog',
  // URL of development API
  apiUrlCatalogBoundaries: 'http://sppkube.eastus.cloudapp.azure.com/api/v1/catalog_boundaries',
  // URL of development API
  apiUrlEvent: 'http://sppkube.eastus.cloudapp.azure.com/api/v1/events',
  // viewer chart height in pixels
  chartHeight: 120,
  // page Y offset to start channel viewers due to toolbars, pagination, etc.
  pageOffsetY: 90,
  // fixed duration to display, in seconds
  fixedDuration: 2,
  // steps for wheel mouse zoom sensitivity
  zoomSteps: 5,
  // sensitivity for capturing picks to drag
  snapDistance: 10
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
