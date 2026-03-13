import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const setup = async (returnUrl: unknown) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: { returnUrl } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  it('should create', () => {
    return setup(undefined).then(() => {
      expect(component).toBeTruthy();
    });
  });

  it('uses allowed returnUrl when provided', async () => {
    await setup('/achievements');
    expect(component.returnUrl).toBe('/achievements');
  });

  it('rejects external returnUrl', async () => {
    await setup('https://evil.example/steal');
    expect(component.returnUrl).toBe('/dashboard');
  });
});
