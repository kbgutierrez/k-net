/**
 * formControlValidate
 * - A simple form validation function
 *
 * TODO: Should be able to accept, array of validation type ['required', 'count']
 * @param element element/field to be validated
 * @param type specify the type of validation
 * @returns boolean
 */
function form_control_validate(element, type, module_name = '', trans_type) {
    var module_name = module_name;
    if (type == 'required') {
        if (element.val() === '') {
            return false;
        }
        return true;
    }
    if (type == 'unique') {
        var response_return = false;
        ajax_loader_no_async('helper/form/validate/unique', { name: element.attr('name'), value: element.val(), module_name: module_name, trans_type: trans_type }).done(function (response) {
            var response = $.parseJSON(response);
            response_return = (response.response) ? true : false;
        });
        return response_return;
    }
}
/**
 * showMessage
 * - Show dynamic error messages
 * @param element
 * @returns voids
 */
function validation_message_show(element, type) {
    // if (element.next('.error').length === 0) {
    element.parent().removeClass('has-error');
    element.next('.error').remove();
    var elementLabel = element.prev('label').text();
    element.parent().addClass('has-error');
    var message = (type == 'required') ? ' is required.' : ' already exist.';
    element.after('<p class="error text-white mt-2 badge badge-danger">' + elementLabel + message + '</p>');
    // }
}

function validation_message_hide(element) {
    if (element.next('.error').length) {
        element.parent().removeClass('has-error');
        element.next('.error').remove();
    }
}

function has_no_error() {
    return ($('.error').length === 0) ? true : false;
}

function validate_form(element, module_name = '', trans_type = 'masterdata') {
    var class_name = element.find('.required');
    class_name.each(function () {
        // () ?  : validation_message_hide($(this));
        if ($(this).hasClass('required-select2')) {
            if ($(this).val() == null) {
                $(this).siblings('.select2-error').remove();
                var elementLabel = $(this).prev('label').text();

                $(this).next('.select2').children('.selection').children('.select2-selection').attr('style', 'border: 1px solid #F25961 !important');
                $(this).parent().append('<p class="error select2-error text-white mt-2 badge badge-danger">' + elementLabel + ' is required' + '</p>');
                $(this).parent().addClass('has-error');
            } else {
                $('.select2-error').remove();
                $(this).parent().removeClass('has-error');
                $(this).next('.select2').children('.selection').children('.select2-selection').css('border-color', '#ebedf2');
            }

        } else {
            if (!form_control_validate($(this), 'required', module_name, trans_type)) {
                validation_message_show($(this), 'required');
            } else {
                if ($(this).hasClass('unique')) {
                    // console.log(form_control_validate($(this), 'unique', module_name));
                    if (form_control_validate($(this), 'unique', module_name, trans_type)) {
                        validation_message_show($(this), 'unique');
                    } else {
                        validation_message_hide($(this));
                    }
                } else {
                    validation_message_hide($(this));
                }
            }
        }
    });
}

/**
 *
 * BY KEN 2023-06-20
 *
 */
function human_date(date) {
    var date = new Date(date);
    var year = date.toLocaleString("default", { year: "numeric" });
    var month = date.toLocaleString("default", { month: "2-digit" });
    var day = date.toLocaleString("default", { day: "2-digit" });
    var time = date.toLocaleString("default", { hour: "numeric", minute: "numeric", second: "numeric" , hour12: true} );
    var formattedDate = year + "-" + month + "-" + day + " "+ time;
    return formattedDate;
}