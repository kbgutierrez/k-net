// clickable viewing
$(document).on('click', '.row-action', function (e) {
  e.preventDefault();
  var parent = $(this).parent().parent();
  // get values
  var transaction_code = parent.data('transaction-code');
  var transaction_id = parent.data('transaction-id');
  var sales_group = parent.data('sales-group');
  var principal_code = parent.data('principal-code');
  var params = {
    transaction_code: transaction_code,
    principal_code: principal_code,
    sales_group: sales_group,
    transaction_id: transaction_id
  }
  ajax_loader('helper/transaction/detail', { params: params }).done(function (response) {
    $('#modal-body-transaction-details').html();
    $('#modal-body-transaction-details').empty();
    $('#modal-body-transaction-details').html(response);
    $('#modal-transaction-details').modal('show');
  });
});