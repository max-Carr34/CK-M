import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[hasRole]'
})
export class HasRoleDirective implements OnInit, OnDestroy {

  private allowedRoles: string[] = [];
  private sub!: Subscription;

  @Input()
  set hasRole(roles: string[]) {
    // Normalizamos los roles
    this.allowedRoles = roles.map(r => r.trim().toLowerCase());
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Escuchar cambios de rol (login / logout)
    this.sub = this.authService.role$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView() {
    this.viewContainer.clear();

    const userRole = this.authService.getUserRole();

    if (userRole && this.allowedRoles.includes(userRole)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
