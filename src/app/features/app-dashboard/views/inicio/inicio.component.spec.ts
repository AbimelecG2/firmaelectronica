import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioComponent } from './inicio.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';

describe('InicioComponent', () => {
  let component: InicioComponent;
  let fixture: ComponentFixture<InicioComponent>;

  beforeEach(async () => {
    const firestoreStub = {
      collection: jasmine.createSpy('collection').and.returnValue({
        valueChanges: jasmine.createSpy('valueChanges').and.returnValue(of([1, 2, 3]))
      })
    };

    await TestBed.configureTestingModule({
      declarations: [InicioComponent],
      providers: [{ provide: AngularFirestore, useValue: firestoreStub }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load totalFirmas from Firestore', () => {
    expect(component.totalFirmas).toBe(3); // Basado en el stub de datos
  });

  it('should render report title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.report-title').textContent).toContain('Reporte Digital');
  });
});