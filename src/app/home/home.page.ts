import { Component } from '@angular/core';
import { AuthenticateService } from '../services/auth.service';
import { CrudService } from '../services/crud.service';
import { Storage, getDownloadURL, ref, uploadBytesResumable } from '@angular/fire/storage';
import { MessageService } from '../services/message.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  perfil: any = {
    foto: null,
    nome: null,
    profissao: null,
    nome_usuario: null,
    idioma: null,
    localidade: null,
    data_inicio: null,
    biografia: null,
    estatiticas: {
      curtidas: 0,
      seguindo: 0,
      amigos: 0
    },
    postagem: [
      {
        foto: 'https://i.pinimg.com/736x/ea/c6/35/eac6359e09b915a9530f78563e6ddcea.jpg',
        nome: 'Lloyde Frontera',
        nome_usuario: '@LloydeFrontera',
        texto: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Cupiditate, veritatis voluptas tempora corporis ea vero molestiae aperiam labore voluptatem explicabo odio distinctio quam sapiente eos!',
        data: '12/03/2025 14:00'
      },
      {
        foto: 'https://preview.redd.it/lloyd-frontera-from-the-greatest-estate-developer-is-the-v0-hvxcerpgdu5e1.jpg?width=419&format=pjpg&auto=webp&s=6ee76cf8da383bb05992a9abaad1ed16edcb0425',
        nome: 'Lloyde Frontera',
        nome_usuario: '@LloydeFrontera',
        texto: 'Outro Exemplo',
        data: '12/03/2025 15:00'
      },
      {
        foto: 'https://i.pinimg.com/736x/36/dd/45/36dd458c0b1bcc2a49e0ac19402581e1.jpg',
        nome: 'Lloyde Frontera',
        nome_usuario: '@LloydeFrontera',
        texto: 'Hihiha',
        data: '12/03/2025 16:00'
      }
    ]
  }

  constructor(){

  }

}
