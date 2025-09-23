import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'http://localhost:8000/api/';

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    try {
      const token = await this.storage.get('auth_token');
      
      if (token) {
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        });
      } else {
        return new HttpHeaders({
          'Accept': 'application/json'
        });
      }
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return new HttpHeaders({
        'Accept': 'application/json'
      });
    }
  }

  get(endpoint: string): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.get(this.apiUrl + endpoint, { headers });
      })
    );
  }

  post(endpoint: string, body: any): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post(this.apiUrl + endpoint, body, { headers });
      })
    );
  }

  
  // Adicione outros métodos (put, delete, etc) se necessário
}