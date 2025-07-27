document.addEventListener('DOMContentLoaded', () => {
    const farmerTypeRadios = document.querySelectorAll('input[name="farmerType"]');
    const chickTypeRadios = document.querySelectorAll('input[name="chickType"]');
    const numChicksInput = document.getElementById('numChicks');
    const maxChicksSpan = document.getElementById('maxChicks');
    const unitPriceInput = document.getElementById('unitPrice');
    const totalPriceInput = document.getElementById('totalPrice');
    const priceCalculationPara = document.getElementById('priceCalculation');
    const requestDateInput = document.getElementById('requestDateInput');
    const commentsTextarea = document.getElementById('comments');

    const summaryFarmerType = document.getElementById('summaryFarmerType');
    const summaryChickType = document.getElementById('summaryChickType');
    const summaryQuantity = document.getElementById('summaryQuantity');
    const summaryUnitPrice = document.getElementById('summaryUnitPrice');
    const summaryDate = document.getElementById('summaryDate');
    const summaryComments = document.getElementById('summaryComments');
    const summaryTotal = document.getElementById('summaryTotal');

    const CHICK_UNIT_PRICE = 1650;

    function formatUGX(amount) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function updateCalculationsAndSummary() {
        let selectedFarmerType = '';
        let maxAllowedChicks = 100;
        farmerTypeRadios.forEach(radio => {
            if (radio.checked) {
                selectedFarmerType = radio.value;
                if (selectedFarmerType === 'returning') {
                    maxAllowedChicks = 500;
                }
            }
        });

        numChicksInput.max = maxAllowedChicks;
        maxChicksSpan.textContent = maxAllowedChicks;

        let numChicks = parseInt(numChicksInput.value);
        if (isNaN(numChicks) || numChicks < 1) {
            numChicks = 1;
            numChicksInput.value = 1;
        } else if (numChicks > maxAllowedChicks) {
            numChicks = maxAllowedChicks;
            numChicksInput.value = maxAllowedChicks;
        }

        let selectedChickType = '';
        chickTypeRadios.forEach(radio => {
            if (radio.checked) {
                selectedChickType = radio.value;
            }
        });

        const unitPrice = CHICK_UNIT_PRICE;
        const totalPrice = numChicks * unitPrice;

        unitPriceInput.value = formatUGX(unitPrice);
        totalPriceInput.value = formatUGX(totalPrice);
        priceCalculationPara.textContent = `${numChicks} chicks x ${formatUGX(unitPrice)}/chick = ${formatUGX(totalPrice)}`;

        summaryFarmerType.textContent = selectedFarmerType.charAt(0).toUpperCase() + selectedFarmerType.slice(1) + ' Farmer';
        summaryChickType.textContent = selectedChickType.charAt(0).toUpperCase() + selectedChickType.slice(1);
        summaryQuantity.textContent = numChicks;
        summaryUnitPrice.textContent = formatUGX(unitPrice);
        summaryDate.textContent = requestDateInput.value || 'Not set';
        summaryComments.textContent = commentsTextarea.value || 'No comments';
        summaryTotal.textContent = formatUGX(totalPrice);
    }

    farmerTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateCalculationsAndSummary);
    });

    chickTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateCalculationsAndSummary);
    });

    numChicksInput.addEventListener('input', updateCalculationsAndSummary);

    requestDateInput.addEventListener('input', updateCalculationsAndSummary);

    commentsTextarea.addEventListener('input', updateCalculationsAndSummary);

    unitPriceInput.value = formatUGX(CHICK_UNIT_PRICE);
    updateCalculationsAndSummary();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    requestDateInput.value = `${yyyy}-${mm}-${dd}`;
    updateCalculationsAndSummary();
});
