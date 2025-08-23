import { TestBed } from '@angular/core/testing';

import { SweetAlert } from './sweet-alert';

describe('SweetAlert', () => {
  let service: SweetAlert;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SweetAlert);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
