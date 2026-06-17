function show_swal(url, message = 'Record has been saved') {
  Swal.close();
  Swal.fire({
    text: message,
    icon: 'success',
    showCloseButton: true,
    didClose: () => {
      window.location.replace(base_url + url);
    },
    showClass: {
      backdrop: 'swal2-noanimation', // disable backdrop animation
      popup: '', // disable popup animation
      icon: '' // disable icon animation
    },
    hideClass: {
      popup: '', // disable popup fade-out animation
    }
  });
}