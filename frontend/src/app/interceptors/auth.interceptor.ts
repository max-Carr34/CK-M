import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, switchMap, catchError, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  const auth = inject(AuthService);
  const token = auth.getToken();

  let authReq = req;

  // 🔐 Agregar token
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(

    catchError((error: HttpErrorResponse) => {

      if (error.status === 401 || error.status === 403) {

        if (!isRefreshing) {

          isRefreshing = true;
          refreshTokenSubject.next(null);

          return auth.refreshToken().pipe(

            switchMap((res: any) => {

              isRefreshing = false;

              const newToken = res.accessToken;
              auth.saveToken(newToken);

              refreshTokenSubject.next(newToken);

              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                })
              );
            }),

            catchError(err => {
              isRefreshing = false;
              auth.logout();
              return throwError(() => err);
            })
          );
        }

        return refreshTokenSubject.pipe(
          filter(token => token !== null),
          take(1),
          switchMap(token =>
            next(
              req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`
                }
              })
            )
          )
        );
      }

      return throwError(() => error);
    })
  );
};