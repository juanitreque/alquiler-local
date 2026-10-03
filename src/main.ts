import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import './app.css';
import App from './App.svelte';
import { pedirPersistencia } from './datos/almacen';
import { iniciar } from './datos/estado.svelte';

registerSW({ immediate: true });
void pedirPersistencia();
void iniciar();

mount(App, { target: document.getElementById('app')! });
