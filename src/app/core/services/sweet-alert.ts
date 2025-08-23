import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlert {


  // ✅ Alerta genérica (elige icono manualmente)
  show(title: string, text: string, icon: SweetAlertIcon = 'info') {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonText: 'Aceptar'
    });
  }


  success(message: string, title: string = '¡Éxito!') {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#16a34a' // verde
    });
  }


  error(message: string, title: string = '¡Error!') {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#dc2626' // rojo
    });
  }

  warning(message: string, title: string = '¡Advertencia!') {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      confirmButtonColor: '#f59e0b' // amarillo
    });
  }


  info(message: string, title: string = 'Información') {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'info',
      confirmButtonColor: '#3b82f6' // azul
    });
  }


  confirm(title: string, text: string, confirmText: string = 'Sí', cancelText: string = 'Cancelar') {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true
    });
  }

  
  loading(message: string = 'Cargando...') {
    return Swal.fire({
      title: message,
      allowOutsideClick: false, // no se cierra al hacer click afuera
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  
  close() {
    Swal.close();
  }


  toast(message: string, icon: SweetAlertIcon = 'success') {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: icon,
      title: message
    });
  }


}
