export const environment = {
  production: true,

  // URL of the API
  apiUrl: 'http://sppkube.eastus.cloudapp.azure.com/api/v1/',
  // Catalog API endpoint
  apiCatalog: 'catalog',
  // Catalog Boundaries API endpoint
  apiCatalogBoundaries: 'catalog_boundaries',
  // Events API endpoint
  apiEvents: 'events',
  // Origins API endpoint
  apiOrigins: 'origins',
  // Traveltimes API endpoint
  apiTravelTimes: 'traveltimes',
  // Arrivals API endpoint
  apiArrivals: 'picks',
  // number of charts per page
  chartsPerPage: 8,
  // fixed duration to display, in seconds
  fixedDuration: 2,
  // steps for wheel mouse zoom sensitivity
  zoomSteps: 5,
  // sensitivity for capturing picks to drag
  snapDistance: 10,
  // colors for components line plots
  linecolor : {
    'X': 'red',
    'Y': 'green',
    'Z': 'blue',
    'C': 'black'
  },
  // component to determine sign for composite trace
  signComponent: 'X',
  // composite trace component code
  compositeChannelCode: 'C',
  // filtered trace component code suffix
  filteredChannelCode: 'F',
  // time zone for data display
  zone: 'Asia/Ulaanbaatar'
};
