import { TestBed } from '@angular/core/testing';

import { Sqlite } from './sqlite';

describe('Sqlite', () => {
  let service: Sqlite;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sqlite);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
