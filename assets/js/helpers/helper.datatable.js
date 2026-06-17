var columns = [];

function load_datatable(element, module_name, url, params = {}) {
    element.DataTable().clear().destroy();
    element.DataTable({
        'processing': true,
        'serverSide': true,
        'order': [],
        'searching': false,
        // autoWidth: true,
        'ajax': {
            url: base_url + url,
            type: 'POST',
            data: {
                table_name: module_name,
                params: params
            }
        },
        initComplete: function (settings, json) {
            element.wrap(
                "<div style='overflow:auto; width:100%;position:relative;'></div>"
            );
            Swal.close();
        },
        'columnDefs': [{
            'targets': [0],
            'orderable': false,
            'visible': false
        },],
        createdRow: function (row, data, index) {
            $(row).addClass('record_row row_' + data.id);
        },
    });
}
/*
params = {
    element: element,
    module_name: module_name,
    url: url,
    params: params,
    data_attr: data_attr,
    row_id: row_id,
    options : {
        actions: true | false,
        lengthChange: true | false,
        trans_type: transaction | masterdata
        has_quantity_confirmation: true | false,
        where_clause: where_clause
    }
}
*/
function load_transaction_table(params) {
    var columns = [];
    var where_extra = [];
    var hidden = [0];

    var order_by = [];


    var lengthChange = (params.options.lengthChange) ? true : false;
    var paging = (params.options.paging) ? true : false;

    var transaction_type = 'transaction';
    var url = 'helper/get/columns/trans';
    var has_quantity_confirmation = false;
    var database_name = '';
    var row_id = 'id';
    if (params.options.hasOwnProperty('transaction_type')) {
        transaction_type = params.options.transaction_type;
    }

    if (params.hasOwnProperty('order_by')) {
        order_by = params.order_by;
    }
    if (params.hasOwnProperty('row_id')) {
        row_id = params.row_id;
    }
    if (params.options.hasOwnProperty('has_quantity_confirmation')) {
        has_quantity_confirmation = params.options.has_quantity_confirmation;
    }
    if (params.options.hasOwnProperty('database_name')) {
        database_name = params.options.database_name;
    }
    if (params.options.hasOwnProperty('hide_columns')) {
        hidden.push(...params.options.hide_columns);
    }
    if (params.options.hasOwnProperty('where_extra')) {
        where_extra = params.options.where_extra;
    }

    ajax_loader(url, { table_name: params.module_name, transaction_type: transaction_type, database_name: database_name }).done(function (response) {
        var response = $.parseJSON(response);
        columns.push({ 'data': '0', 'title': '0' });
        if (params.options.actions) {
            $('#for-action').css('diplay', 'block')
            columns.push({ 'data': 'edit', 'title': 'Action' });
        } else {
            $('#for-action').css('display', 'none');
        }
        $(response).each(function (key, val) {
            var title = val.replace('_', ' ');
            var ftitle = title.replace(/\b\w/g, l => l.toUpperCase());
            columns.push({ 'data': val, 'title': ftitle });
        });
        var params_array = [];
        // if filter parameters
        if (!$.isEmptyObject(params.params)) {
            params_array = params.params
        }
        params.element.DataTable().clear().destroy();
        params.element.DataTable({
            'processing': true,
            'serverSide': true,
            'paging': paging,
            'order': order_by,
            'lengthChange': lengthChange,
            'searching': false,
            'ajax': {
                url: base_url + params.url,
                type: 'POST',
                data: {
                    table_name: params.module_name,
                    transaction_type: transaction_type,
                    has_quantity_confirmation: has_quantity_confirmation,
                    params: params_array,
                    row_id: row_id,
                    database_name: database_name,
                    where_extra: where_extra
                },
            },
            'columnDefs': [{
                'targets': hidden,
                'orderable': false,
                'visible': false,
            },],
            columns: columns,
            initComplete: function (settings, json) {
                params.element.wrap(
                    "<div style='overflow:auto; width:100%;position:relative;'></div>"
                );
                var api = this.api();
                if (transaction_type == 'transaction') {
                    // api.column(-1).visible(false);
                }
                if (transaction_type == 'masterdata') {
                    // api.column(1).visible(false);
                }
            },
            createdRow: function (row, data, index) {
                $(row).addClass('record_row row_' + data.id);
                if (params.options.actions) {
                    $(row).attr('data-transaction-code', data.transaction_code);
                    $(row).attr('data-principal-code', data.principal_code);
                    $(row).attr('data-sales-group', data.sales_group);
                    $(row).attr('data-transaction-id', data.transaction_id);
                }
            },
        });
    });
}

function load_datatable_basic(element) {
    // element.DataTable().clear().destroy();
    element.DataTable({
        initComplete: function (settings, json) {
            element.wrap(
                "<div style='overflow:auto; width:100%;position:relative;'></div>"
            );
        }
    });
}

function load_table_header(params) {
    var database_name = '';
    var table_name = '';
    var type = '';
    if (params.hasOwnProperty('database_name')) {
        database_name = params.database_name;
    }
    if (params.hasOwnProperty('table_name')) {
        table_name = params.table_name;
    }
    if (params.hasOwnProperty('type')) {
        type = params.type;
    }
    ajax_loader_no_async(params.url, { database_name: params.database_name, table_name: table_name, type: type }).done(function (response) {
        params.element.empty();
        params.element.html();
        params.element.html(response);
    });
}