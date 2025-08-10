import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    const routerStub = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule],
      providers: [
        { provide: Router, useValue: routerStub }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /inicio with correct credentials', () => {
    const router = TestBed.inject(Router);
    component.username = 'admin';
    component.password = '12346';
    component.onLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should set error message with incorrect credentials', () => {
    component.username = 'wrong';
    component.password = 'wrong';
    component.onLogin();
    expect(component.errorMessage).toBe('Usuario o contraseña incorrectos');
  });
});