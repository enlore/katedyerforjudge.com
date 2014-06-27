$(document).ready(function () {
    $('#timer-ultimate').countdown({ until: new Date(2014, 8 - 1, 8), compact: true })
    $('#timer-early').countdown({until: new Date(2014, 7 - 1, 23), compact: true })

    // Stripe
    Stripe.setPublishableKey('pk_test_gaLOWFmLlT7GpIAzmhMvmubG')

    $donateForm = $("#confirm-donate").on('submit', function (e) {
        e.preventDefault() 

        $donateForm.find('[type=submit]').prop('disabled', true)

        Stripe.card.createToken($donateForm, function (stat, response) {
            if (response.error) {
                $donateForm.find('.errors').text(response.error.message) 
                $donateForm.find('[type=submit]').prop('disabled', false)
            } else {
                var token = response.id
                console.log(token)

                $donateForm.append($('<input type="hidden" name="stripeToken">').val(token))
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
