$(document).on('click', '.btn-upload', function (e) {
  e.preventDefault();
  var table_name = $(this).data('table-name');
  var download_href = base_url + 'export/template/' + table_name;
  $('#store-upload-table-name').val(table_name);
  $('#link-template-download').attr('href', download_href);
  $('#modal-upload-data-title').text('');
  $('#modal-upload-data-title').text(table_name);
  $('#modal-upload-data').modal({
    backdrop: 'static',
    keyboard: false
  }, 'show');
});
$(document).on('submit', '#form-file-upload', function (e) {
  e.preventDefault();
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
  var upload_template = $("#file-upload-template")[0].files.length;
  if (upload_template !== 0) {
    var form_data = new FormData();

    var table_name = $('#store-upload-table-name').val();

    form_data.append('file', $('input[type=file]')[0].files[0]);
    form_data.append('table_name', table_name);
    $.ajax({
      xhr: function () {
        var xhr = new window.XMLHttpRequest();
        // xhr.upload.addEventListener('progress', function (e) {
        //   if (e.lengthComputable) {
        //     percent = Math.round((e.loaded / e.total) * 100);
        //     $('#progressBar').attr('aria-valuenow', percent).css('width', percent + '%').text(percent + '%');
        //   }
        // });
        return xhr;
      },
      type: 'POST',
      data: form_data,
      url: base_url + 'export/template/upload',
      success: function (response) {

        var response = $.parseJSON(response);
        if (response.response) {
          Swal.close();
          Swal.fire({
            title: 'Mass Upload successful.',
            icon: 'success',
            showCloseButton: true,
            didClose: () => {
              location.reload();
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
      },
      cache: false,
      contentType: false,
      processData: false
    });
  } else {
    Swal.fire({
      title: 'Please select a file.',
      type: 'error',
      showCloseButton: true,
    });
  }
});