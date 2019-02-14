import { TestBed } from '@angular/core/testing';

import { CatalogApiService } from './catalog-api.service';

describe('CatalogApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CatalogApiService = TestBed.get(CatalogApiService);
    expect(service).toBeTruthy();
  });
});
