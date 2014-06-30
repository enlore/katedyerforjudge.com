$(document).ready(function () {
    $('#timer-ultimate').countdown({ until: new Date(2014, 8 - 1, 8), compact: true })
    $('#timer-early').countdown({until: new Date(2014, 7 - 1, 23), compact: true })

    // Stripe
    Stripe.setPublishableKey('pk_test_gaLOWFmLlT7GpIAzmhMvmubG')

    // donation info form
    var $donateForm = $('#donate-form')

    $donateForm.on('submit', function (e) {
        e.preventDefault() 

        var fieldsMessages = [
            {'name': 'human_name', 'message': 'Please provide your full name.'},
            {'name': 'email', 'message': 'Please enter your email.'},
            {'name': 'phone', 'message': 'Please list your phone number.'},
            {'name': 'address', 'message': 'Please fill in your address.'},
            {'name': 'city', 'message': 'Please indicate your city.'},
            {'name': 'zip_code', 'message': 'Please give your zip code.'},
            {'name': 'occupation', 'message': 'Please tell us your occupation.'},
            {'name': 'employer', 'message': 'Please state the name of your employer.'}
        ]

        var hasError = false

        for (var i = 0; i < fieldsMessages.length; i++) {
            var selector = '[name="'+ fieldsMessages[i]['name']  + '"]'

            var val = $donateForm.find(selector).val()
            console.log('val of %s: %s', fieldsMessages[i]['name'], val)

            if (val === '') {
                console.log('Validation error: %s', fieldsMessages[i]['message'])  
                hasError = true
                $donateForm.find('label[for="' + fieldsMessages[i]['name']+ '"]').text(fieldsMessages[i]['message']).parent().addClass('has-error')
            }

            if (!hasError)
                e.target.submit()
        }

        // get val from input by name
        // if empty string, reject
        //  reject: swap out label for help message
        //  if no rejections, submit form
    })

    // confirm form
    var $confirmForm = $("#confirm-donate")

    $confirmForm.on('submit', function (e) {
        e.preventDefault() 


        $confirmForm.find('[type=submit]').prop('disabled', true)

        Stripe.card.createToken($confirmForm, function (stat, response) {
            if (response.error) {
                $confirmForm.find('.errors').text(response.error.message) 
                $confirmForm.find('[type=submit]').prop('disabled', false)
            } else {
                var token = response.id
                console.log(token)

                $confirmForm.append($('<input type="hidden" name="stripeToken">').val(token))
                e.target.submit()
            }
        })
    })


    // Checkbox donation form handler
    var $otherCheckbox      = $('#other-checkbox')
      , $amountSelect       = $('#amount-select')
      , $otherAmount        = $('<label for="other_amount">Other Amount</label><div class="input-group"><span class="input-group-addon">$</span><input id="other-amount" type="text" class="form-control" name="other_amount"><span class="input-group-addon">.00</span></div>')
      , $otherContainer     = $('#other-amount-container')
      ;

    $otherCheckbox.on('change', function (e) {
        if (this.checked) {
            $amountSelect.prop('disabled', true) 
            $otherContainer.append($otherAmount)
        } else {    
            $amountSelect.prop('disabled', false) 
            $otherContainer.children().remove()
        }
    })

    $otherAmount.on('change', function (e) {
    })
})
