function ajax_loader(url, post_data, data_type = 'JSON') {
  return $.ajax({
    type: 'POST',
    url: base_url + url,
    data_type: data_type,
    data: post_data
  });
}

function ajax_loader_no_async(url, post_data, data_type) {
  return $.ajax({
    type: 'POST',
    url: base_url + url,
    data_type: data_type,
    data: post_data,
    async: false
  });
}


// function ajax_loader_formdata(url, formData) {
//   return $.ajax({
//       type: 'POST',
//       url: base_url + url,
//       data: formData,
//       contentType: false,
//       processData: false,
//       async: false
//   });
  function ajax_loader_formdata(url, formData) {
    return $.ajax({
        type: 'POST',
        url: base_url + url,
        data: formData,
        contentType: false,
        processData: false,
        
    });
   
}

function ajax_loader_formdata_loading(url, formData) {
  return $.ajax({
      type: 'POST',
      url: base_url + url,
      data: formData,
      contentType: false,
      processData: false,
      beforeSend: function() {

        $('#modal-loading').show();
        console.log('loading');
       },
       success: function(msg) {
    
          $('#modal-loading').hide();
          console.log('success');
       }
  });
 
}

  function ajax_loader_loading(url, post_data, data_type = 'JSON') {
    return $.ajax({
      type: 'POST',
      url: base_url + url,
      data_type: data_type,
      data: post_data,
      beforeSend: function() {

        $('#modal-loading').show();
        console.log('loading');
       },
       success: function(msg) {
    
          $('#modal-loading').hide();
          console.log('success');
       }
    });
  }


