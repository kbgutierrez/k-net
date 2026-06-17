$(document).on('click', '#btn-login', function (e) {
    e.preventDefault();
    $('#form-login').submit();
});
$(document).on('submit', '#form-login', function (e) {
    e.preventDefault();
    validate_form($(this), '');
    if (has_no_error()) {
        Swal.fire({
            html: "<h4>Loading...</h4>",
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false,
            showClass: {
                backdrop: 'swal2-noanimation', // disable backdrop animation
                popup: '', // disable popup animation
                icon: '' // disable icon animation
            },
            hideClass: {
                popup: '', // disable popup fade-out animation
            }
        });
        ajax_loader('login/validate', { post_data: $(this).serializeArray() }).done(function (response) {
            var response = $.parseJSON(response);
            if (response.status) {
                window.location.replace(base_url + 'dashboard ');
            }
            if (!response.status) {
                Swal.close();
                Swal.fire({
                    title: response.response_message,
                    icon: 'error',
                    showCloseButton: true,
                    didClose: () => {
                        Swal.close();
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
        });
    }
});