$(document).ready(function () {
    $('#timer-ultimate').countdown({ until: new Date(2014, 8 - 1, 8), compact: true })
    $('#timer-early').countdown({until: new Date(2014, 7 - 1, 18), compact: true })

    // Stripe
    Stripe.setPublishableKey('pk_test_4KdRZshXd8fpZnzZPrwuKJ28')

    // volunteer form
    var $volunteerForm = $('#volunteer-form')

    $volunteerForm.on('submit', function (e) {
        e.preventDefault()

        var fieldsMessages = [
            {'name': 'name', 'message': "Don't forget your name."}, 
            {'name': 'phone', 'message': "Can we get your phone number?"},
            {'name': 'email', 'message': "Can we also have your email?"}
        ]

        var hasError = false

        for (var i = 0; i < fieldsMessages.length; i++) {
            var selector = '[name="'+ fieldsMessages[i]['name']  + '"]'

            var val = $volunteerForm.find(selector).val()
            console.log('val of %s: %s', fieldsMessages[i]['name'], val)

            if (val === '') {
                console.log('Validation error: %s', fieldsMessages[i]['message'])  
                hasError = true
                $volunteerForm.find('label[for="' + fieldsMessages[i]['name']+ '"]').text(fieldsMessages[i]['message']).parent().addClass('has-error')
            }

            if (!hasError)
                e.target.submit()
        }
    })

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

        // if other-amount is NaN, we have an error
        // if other-amount is > 1500, we have an error
        var $otherAmount = $('input[name="other_amount"]')

        if ($otherAmount.is(':visible')) {
            var otherVal = Number($otherAmount.val())

            if (isNaN(otherVal)) {
                console.log('otherVal', otherVal)
                var NaNMessage = 'Please be sure to enter a number. No change. Thanks!'
                console.log(NaNMessage) 
                $donateForm.find('label[for="other_amount"]').text(NaNMessage).parent().addClass('has-error')
                hasError = true
            } else if (otherVal > 1500) {
                var tooMuchMessage = 'Donations are limited to $1500 or less.  Thanks, though.'
                $donateForm.find('label[for="other_amount"]').text(tooMuchMessage).parent().addClass('has-error')
                console.log(tooMuchMessage)
                hasError = true
            } else {
                $donateForm.find('label[for="other_amount"]').text("Enter Amount (max $1500)").parent().removeClass('has-error')
            }
        }

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
    })

    // confirm form
    var $confirmForm = $("#confirm-donate")

    $confirmForm.on('submit', function (e) {
        e.preventDefault() 

        var $stripeNumber   = $('#card-number')
          , $stripeCVC      = $('#card-cvc')
          , $stripeExpYear  = $('#card-exp-year')
          ;

        var hasError = false

        if ($stripeNumber.val() === '') {
            $('[for="card-number"]').text('Need your number.').parents('.form-group').addClass('has-error-reg')
            hasError = true
        } else {
            $('[for="card-number"]').text('Number').parents('.form-group').removeClass('has-error-reg')
        }

        if ($stripeCVC.val() === '') {
            $('[for="card-cvc"]').text('CVC?').parents('.form-group').addClass('has-error-reg')
        } else {
            $('[for="card-cvc"]').text('CVC').parents('.form-group').removeClass('has-error-reg')
        }

        if ($stripeExpYear.val() === '') {
            $('[for="card-exp-year"]').text('Exp Year?').parents('.form-group').addClass('has-error-reg')
        } else {
            $('[for="card-exp-year"]').text('Exp Year').parents('.form-group').removeClass('has-error-reg')
        }

        $confirmForm.find('[type=submit]').prop('disabled', true)

        Stripe.card.createToken($confirmForm, function (stat, response) {
            if (response.error) {
                $confirmForm.find('.errors').text(response.error.message) 
                $confirmForm.find('[type=submit]').prop('disabled', false)
            } else {
                var token = response.id
                console.log(token)

                $confirmForm.append($('<input type="hidden" name="stripeToken">').val(token))

                if (!hasError)
                    e.target.submit()
            }
        })
    })


    // Checkbox donation form handler
    var $donationInfoFieldset = "<fieldset id=\"donation-info\">" +
                               "<legend>Donation Information</legend>" +
                               '<p class="hint">' +
                               'The law requires us to collect this info.  You can put' +
                               '"N/A" if you\'re not employed, or "self-employed" if you are self employed.' +
                               '</p>' +
                               '<p class="hint">' +
                               'If you put "self-employed", please describe what you do in a couple of words.' +
                               '</p>' +
                               '<div class="form-group">' +
                               '<label for="address">Your Street Address</label>' +
                               '<input type="text" name="address" class="form-control">' +
                               '</div>' +
                               '<div class="form-group">' +
                               '<label for="city">Your City</label>' +
                               '<input type="text" name="city" class="form-control">' +
                               '</div>' +
                               '<div class="form-group">' +
                               '<label for="zip_code">Your Zip Code</label>' +
                               '<input type="text" name="zip_code" class="form-control">' +
                               '</div>' +
                               '<div class="form-group">' +
                               '<label for="occupation">Your Occupation</label>' +
                               '<input type="text" name="occupation" class="form-control">'+
                               '</div>'+
                               '<div class="form-group">' +
                               '<label for="employer">Your Employer</label>' +
                               '<input type="text" name="employer" class="form-control">' +
                               '</div>' +
                               '</fieldset>';


    // donation form expands conditionally if a person gives > $100
    var $otherCheckbox      = $('#other-checkbox')
      , $amountSelect       = $('#amount-select')
      , $otherAmount        = $('<label for="other_amount">Enter Amount</label><p class="hint">The law allows for a maximum donation $1500.</p><div class="input-group"><span class="input-group-addon">$</span><input id="other-amount" type="text" class="form-control" name="other_amount"><span class="input-group-addon">.00</span></div>')
      , $otherContainer     = $('#other-amount-container')
      , $personalInfo       = $('#personal-info')
      ;

    $otherCheckbox.on('change', function (e) {
        if (this.checked) {
            $amountSelect.prop('disabled', true) 
            $otherContainer.append($otherAmount)
            $('#your-donation').after($donationInfoFieldset)
        } else {    
            $amountSelect.prop('disabled', false) 
            $otherContainer.children().remove()
            $('#donation-info').remove()
        }
    })

    // confirm form features option to change donation amount
    $('#change-amount').on('click', function (e) {
        var $amount = $('#amount')
        var currentAmount = $amount.data('amount') 
        console.log(currentAmount)
        $amount.replaceWith('<label for="amount">Enter New Amount</label><div class="input-group"><span class="input-group-addon">$</span><input class="form-control" type="text" name="amount"><span class="input-group-addon">.00</span></div>')
        $('[name=amount]').val(currentAmount)
        $(this).prop('disabled', true)
    })

    $otherAmount.on('change', function (e) {
    })
})
