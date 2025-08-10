import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenulateralComponent } from './menulateral.component'; 
import { RouterTestingModule } from '@angular/router/testing';

describe('MenulateralComponent', () => {
  let component: MenulateralComponent;
  let fixture: ComponentFixture<MenulateralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenulateralComponent],
      imports: [RouterTestingModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenulateralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render navigation links', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('nav')).toBeTruthy();
    expect(compiled.querySelectorAll('a').length).toBe(8); // 8 enlaces en el menú
  });
});