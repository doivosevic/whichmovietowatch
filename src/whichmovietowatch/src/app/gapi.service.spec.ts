import { TestBed } from '@angular/core/testing';

import { GapiService } from './gapi.service';

describe('GapiService', () => {
  let service: GapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
