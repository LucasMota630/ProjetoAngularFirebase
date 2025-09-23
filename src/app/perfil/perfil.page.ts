import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {

  usuario: any = null;
  carregando: boolean = true;
  editando: boolean = false;
  arquivoFoto: File | null = null;
  previewFoto: string | null = null;
  erro: string = '';

  constructor(
    private apiService: ApiService,
    private storage: Storage,
    private router: Router,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.carregarUsuario();
  }

  async carregarUsuario() {
    try {
      this.carregando = true;
      this.erro = '';
      console.log('🔍 Iniciando carregamento do usuário...');
      
      // Verifica token
      const token = await this.storage.get('auth_token');
      console.log('🔐 Token no storage:', token ? 'Presente' : 'Ausente');
      
      if (!token) {
        this.erro = 'Token não encontrado. Faça login novamente.';
        this.router.navigate(['/login']);
        return;
      }

      // Tenta carregar dados do storage como fallback
      const userData = await this.storage.get('user_data');
      if (userData) {
        console.log('📂 Dados do usuário no storage:', userData);
        this.usuario = userData;
      }

      // Faz requisição para a API
      this.apiService.get('usuario/perfil').subscribe({
        next: (resp: any) => {
          console.log('📦 Resposta da API:', resp);
          
          if (resp && typeof resp === 'object' && Object.keys(resp).length > 0) {
            console.log('✅ API retornou dados válidos');
            this.processarDadosAPI(resp);
          } else {
            console.warn('⚠️ API retornou objeto vazio ou sem dados');
            this.erro = 'API retornou dados vazios. ';
            
            if (this.usuario) {
              this.erro += 'Usando dados salvos localmente.';
              console.log('🔄 Usando dados do storage');
            } else {
              this.erro += 'Nenhum dado local encontrado.';
              this.usuario = this.criarUsuarioPadrao();
            }
          }
          
          this.carregando = false;
        },
        error: (err) => {
          console.error('💥 Erro na requisição:', err);
          this.carregando = false;
          
          if (err.status === 401) {
            this.erro = 'Sessão expirada. Faça login novamente.';
            this.router.navigate(['/login']);
          } else if (err.status === 404) {
            this.erro = 'Endpoint não encontrado. Verifique a URL da API.';
          } else {
            this.erro = `Erro ${err.status}: ${err.error?.message || err.message}`;
          }
          
          // Se tem dados locais, usa eles mesmo com erro
          if (this.usuario) {
            this.erro += ' (Usando dados locais)';
          }
        }
      });
    } catch (error) {
      console.error('💥 Erro inesperado:', error);
      this.carregando = false;
      this.erro = 'Erro interno ao carregar perfil';
    }
  }

  private processarDadosAPI(dados: any) {
    // Tenta extrair dados do usuário de várias estruturas possíveis
    let dadosUsuario = null;

    // Possíveis caminhos
    const caminhos = ['data', 'usuario', 'user', 'perfil', 'profile', 'cliente'];
    
    for (const caminho of caminhos) {
      if (dados[caminho]) {
        dadosUsuario = dados[caminho];
        console.log(`🎯 Dados encontrados em: ${caminho}`, dadosUsuario);
        break;
      }
    }

    // Se não encontrou em caminhos específicos, usa o objeto raiz
    if (!dadosUsuario && (dados.name || dados.email)) {
      dadosUsuario = dados;
    }

    if (dadosUsuario) {
      this.usuario = {
        name: dadosUsuario.name || dadosUsuario.nome || '',
        email: dadosUsuario.email || '',
        status: dadosUsuario.status || 'Ativo',
        picture: dadosUsuario.picture || dadosUsuario.foto || null,
        id: dadosUsuario.id || null
      };
      
      // Salva no storage para uso futuro
      this.storage.set('user_data', this.usuario);
    } else {
      this.erro = 'Não foi possível extrair dados do usuário da resposta da API.';
      this.usuario = this.criarUsuarioPadrao();
    }
  }

  private criarUsuarioPadrao() {
    return {
      name: 'Usuário',
      email: 'usuario@exemplo.com',
      status: 'Ativo',
      picture: null,
      id: null
    };
  }

  // Testa diferentes endpoints
  testarEndpoints() {
    console.log('🔧 Testando endpoints...');
    
    const endpoints = [
      'usuario/perfil',
      'user/profile',
      'auth/user',
      'api/user',
      'perfil',
      'profile'
    ];

    endpoints.forEach(endpoint => {
      this.apiService.get(endpoint).subscribe({
        next: (resp) => {
          console.log(`✅ ${endpoint}:`, resp);
        },
        error: (err) => {
          console.log(`❌ ${endpoint}:`, err.status);
        }
      });
    });
  }

  // Verifica se a API está respondendo
  testarConexaoAPI() {
    console.log('🌐 Testando conexão com API...');
    
    this.apiService.get('').subscribe({
      next: (resp) => {
        console.log('✅ API respondendo:', resp);
      },
      error: (err) => {
        console.log('❌ Erro na API:', err);
      }
    });
  }

  // Resto dos métodos...
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.mostrarErro('Selecione uma imagem válida');
      return;
    }

    this.arquivoFoto = file;
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewFoto = e.target.result;
    reader.readAsDataURL(file);
  }

  uploadFoto() {
    if (!this.arquivoFoto) {
      this.mostrarErro('Selecione uma imagem primeiro');
      return;
    }

    const formData = new FormData();
    formData.append('foto', this.arquivoFoto);

    this.apiService.post('usuario/foto-upload', formData).subscribe({
      next: (resp: any) => {
        console.log('✅ Upload realizado:', resp);
        if (resp.picture_url || resp.foto || resp.url) {
          this.usuario.picture = resp.picture_url || resp.foto || resp.url;
        }
        this.arquivoFoto = null;
        this.previewFoto = null;
        this.mostrarSucesso('Foto atualizada!');
      },
      error: (err) => {
        console.error('❌ Erro no upload:', err);
        this.mostrarErro('Erro ao atualizar foto');
      }
    });
  }

  toggleEdicao() {
    this.editando = !this.editando;
  }

  salvarPerfil() {
    if (!this.usuario?.name?.trim()) {
      this.mostrarErro('Nome é obrigatório');
      return;
    }

    this.apiService.post('usuario/editar', this.usuario).subscribe({
      next: () => {
        this.editando = false;
        this.mostrarSucesso('Perfil atualizado!');
        // Atualiza dados locais
        this.storage.set('user_data', this.usuario);
      },
      error: (err) => {
        console.error('Erro ao salvar:', err);
        this.mostrarErro('Erro ao salvar perfil');
      }
    });
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sair',
      message: 'Deseja realmente sair?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Sair', 
          handler: () => {
            this.storage.remove('auth_token');
            this.storage.remove('user_data');
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarErro(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Erro',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarSucesso(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Sucesso',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }
}