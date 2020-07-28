import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoviemarkerComponent } from './moviemarker.component';

describe('MoviemarkerComponent', () => {
  let component: MoviemarkerComponent;
  let fixture: ComponentFixture<MoviemarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoviemarkerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoviemarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
