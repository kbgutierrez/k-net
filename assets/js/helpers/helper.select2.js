/**
 *
 * @param {*} element
 * @param {*} table_name
 * @param {*} select_col  array
 * {
 *   col_id: col_id,
 *   col_nam: col_name
 * }
 * @param {*} search_col text
 * @param {*} url text
 */


function select2_loader(element, post_data) {

  var show_code = false;
  var where_clause = [];
  if (post_data.hasOwnProperty('show_code')) {
    show_code = post_data.show_code;
  }
  if (post_data.hasOwnProperty('where_clause')) {
    where_clause = post_data.where_clause;
  }


  element.select2({
    allowClear: true,
    placeholder: '--Select Item--',
    theme: 'bootstrap4',
    ajax: {
      url: base_url + 'helper/select2',
      type: 'POST',
      dataType: 'json',
      delay: 500,
      // minimumInputLength: 3,
      processResults: function (data) {
        return {
          results: data.results
        };
      },
      data: function (params) {
        var query = {
          search: {
            name: post_data.search_col,
            value: params.term
          },
          select_col: post_data.select_col,
          table_name: post_data.table_name,
          show_code: show_code,
          where_clause: where_clause
        }
        return query;
      },

    }
  });
}


function select2_trans_loader(element, post_data) {
  var show_code = false;
  if (post_data.hasOwnProperty('show_code')) {
    show_code = post_data.show_code;
  }
  element.select2({
    allowClear: true,
    placeholder: '--Select Item--',
    theme: 'bootstrap4',
    tags: true,
    ajax: {
      url: base_url + 'helper/select2trans',
      type: 'POST',
      dataType: 'json',
      delay: 500,
      // minimumInputLength: 3,
      processResults: function (data) {
        return {
          results: data.results
        };
      },
      data: function (params) {
        var query = {
          search: {
            name: post_data.search_col,
            value: params.term
          },
          select_col: post_data.select_col,
          table_name: post_data.table_name,
          show_code: show_code
        }
        return query;
      }
    }
  });
}



function select2_dropdown(element, transaction_code = '') {
  if (transaction_code === '') {
    element.select2({
      allowClear: true,
      placeholder: '--Select Item--',
      theme: 'bootstrap4',
    });
  } else {
    element.select2({
      allowClear: true,
      placeholder: '--Select Item--',
      theme: 'bootstrap4',
      ajax: {
        url: base_url + 'helper/select2trans/dropdown/fetch',
        type: 'POST',
        dataType: 'json',
        delay: 500,
        processResults: function (data) {
          return {
            results: data.results
          };

        },
        data: function (params) {
          var query = {
            search: params.term,
            transaction_code: transaction_code,

          }
          return query;
        }
      }
    });
  }

}


function select2_sp(element, sp_name) {
  if (sp_name === '') {
    element.select2({
      allowClear: true,
      placeholder: '--Select Item--',
      theme: 'bootstrap4',
    });
  } else {
    element.select2({
      allowClear: true,
      placeholder: '--Select Item--',
      theme: 'bootstrap4',
      ajax: {
        url: base_url + 'helper/select2trans/sp',
        type: 'POST',
        dataType: 'json',
        delay: 500,
        processResults: function (data) {
          return {
            results: data.results
          };

        },
        data: function (params) {
          var query = {
            search: params.term,
            sp_name: sp_name
          }
          return query;
        }
      }
    });
  }

}


function select_sp(element, sp_name) {
  if (sp_name === '') {
    element.select2({
      allowClear: true,
      placeholder: '--Select Item--',
      theme: 'bootstrap4',
    });
  } else {
    element.select2({
      allowClear: true,
      placeholder: '--Select Item--',
      theme: 'bootstrap4',
      ajax: {
        url: base_url + 'helper/select2/sp',
        type: 'POST',
        dataType: 'json',
        delay: 500,
        processResults: function (data) {
          return {
            results: data.results
          };

        },
        data: function (params) {
          var query = {
            search: params.term,
            sp_name: sp_name
          }
          return query;
        }
      }
    });
  }

}