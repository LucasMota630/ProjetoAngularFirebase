import { Injectable } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { Storage } from '@ionic/storage-angular';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PostagemService {
  private storageKey = 'postagens_locais';

  constructor(
    private apiService: ApiService,
    private storage: Storage
  ) {}

  listarPostagens(usuarioId: string): Observable<any[]> {
    return this.apiService.get(`postagens?usuarioId=${usuarioId}`).pipe(
      catchError((error) => {
        console.warn('API offline, usando postagens locais:', error);
        return from(this.storage.get(this.storageKey)).pipe(
          map((postagens: any[]) => {
            return postagens ? postagens.filter(p => p.usuarioId === usuarioId) : [];
          })
        );
      })
    );
  }

  criarPostagem(postagem: any): Observable<any> {
    return this.apiService.post('postagens', postagem).pipe(
      catchError((error) => {
        console.warn('API offline, salvando postagem localmente:', error);
        return from(this.salvarPostagemLocalmente(postagem));
      })
    );
  }

  private async salvarPostagemLocalmente(novaPostagem: any): Promise<any> {
    const postagens = await this.storage.get(this.storageKey) || [];
    novaPostagem.id = Date.now();
    novaPostagem.data = new Date().toISOString();
    novaPostagem.sincronizado = false;
    postagens.unshift(novaPostagem);
    await this.storage.set(this.storageKey, postagens);
    return novaPostagem;
  }

  async sincronizarPostagens(): Promise<void> {
    const postagensLocais = await this.storage.get(this.storageKey) || [];
    
    for (const postagem of postagensLocais) {
      if (!postagem.sincronizado) {
        try {
          await this.apiService.post('postagens', postagem).toPromise();
          postagem.sincronizado = true;
        } catch (error) {
          console.error('Erro ao sincronizar postagem:', error);
        }
      }
    }
    
    await this.storage.set(this.storageKey, postagensLocais);
  }
}