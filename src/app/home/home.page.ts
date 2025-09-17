import { Component } from '@angular/core';
import { AuthenticateService } from '../services/auth.service';
import { CrudService } from '../services/crud.service';
import { Storage, getDownloadURL, ref, uploadBytesResumable } from '@angular/fire/storage';
import { MessageService } from '../services/message.service';
import { Router } from '@angular/router';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  usuario: any = {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  }

  loading: boolean = false;
  mensagem: string = '';

  constructor(
    public apiService: ApiService,
    private router: Router,
    private storage: Storage
  ) { }

  // ✅ ADICIONE ESTE MÉTODO
  async ngOnInit() {
    await this.storage.create(); // Cria o banco de dados do Storage
  }

  async cadastrarUsuario() {
    this.loading = true;
    this.mensagem = '';
    
    this.apiService.post('usuario/registrar-se', this.usuario).subscribe({
      next: async (resp) => {
        console.log('Sucesso!', resp);
        this.loading = false;
        
        // Armazena o token e dados do usuário
        await this.storage.set('auth_token', resp.token);
        await this.storage.set('user_data', resp.user);
        
        // Redireciona para a página de perfil
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        console.error('Erro!', err);
        this.loading = false;
        this.mensagem = err.error?.message || 'Erro ao cadastrar';
      }
    });
  }
}