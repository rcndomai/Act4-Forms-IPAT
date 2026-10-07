document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('rentalForm');
    const summary = document.getElementById('summary');
    const message = document.getElementById('formMessage');
    const pickupDate = document.getElementById('pickupDate');
    const returnDate = document.getElementById('returnDate');
    const today = new Date();
    const todayValue = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);

    pickupDate.min = todayValue;
    returnDate.min = todayValue;

    function setInvalidState(field, invalid) {
        field.classList.toggle('invalid', invalid);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function formatDate(value) {
        const [year, month, day] = value.split('-');
        return `${year}-${month}-${day}`;
    }

    function setSummary(id, value) {
        document.getElementById(id).textContent = value;
    }

    pickupDate.addEventListener('change', function () {
        returnDate.min = pickupDate.value || todayValue;
        if (returnDate.value && returnDate.value <= pickupDate.value) {
            returnDate.value = '';
        }
    });

    form.addEventListener('input', function (event) {
        if (event.target.matches('input, select')) {
            setInvalidState(event.target, false);
            message.textContent = '';
        }
    });

    form.addEventListener('reset', function () {
        setTimeout(function () {
            document.querySelectorAll('input, select').forEach(function (field) {
                setInvalidState(field, false);
            });
            returnDate.min = todayValue;
            summary.classList.add('hidden');
            message.textContent = '';
        }, 0);
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        message.textContent = '';

        const requiredFields = Array.from(form.querySelectorAll('[required]'));
        let isValid = true;

        requiredFields.forEach(function (field) {
            const fieldIsValid = field.checkValidity();
            setInvalidState(field, !fieldIsValid);
            if (!fieldIsValid) isValid = false;
        });

        const phone = document.getElementById('phone');
        if (!/^\d{11}$/.test(phone.value.trim())) {
            setInvalidState(phone, true);
            isValid = false;
        }

        if (pickupDate.value && pickupDate.value < todayValue) {
            setInvalidState(pickupDate, true);
            isValid = false;
        }

        if (pickupDate.value && returnDate.value && returnDate.value <= pickupDate.value) {
            setInvalidState(returnDate, true);
            isValid = false;
        }

        if (!isValid) {
            message.textContent = 'Please complete all required fields and check the contact number and rental dates.';
            summary.classList.add('hidden');
            return;
        }

        const carType = document.getElementById('carType');
        const selectedCar = carType.options[carType.selectedIndex];
        const dailyRate = Number(selectedCar.dataset.rate);
        const start = new Date(`${pickupDate.value}T00:00:00`);
        const end = new Date(`${returnDate.value}T00:00:00`);
        const rentalDays = Math.round((end - start) / 86400000);
        const carCost = dailyRate * rentalDays;
        const selectedServices = Array.from(form.querySelectorAll('input[name="service"]:checked'));
        const serviceCost = selectedServices.reduce(function (total, service) {
            const rate = Number(service.dataset.rate);
            return total + rate * (service.value === 'driver' ? 1 : rentalDays);
        }, 0);
        const discount = rentalDays >= 7 ? carCost * 0.10 : 0;
        const taxableAmount = carCost + serviceCost - discount;
        const tax = taxableAmount * 0.12;
        const grandTotal = taxableAmount + tax;
        const amountPaid = Number(document.getElementById('amountPaid').value);
        const difference = amountPaid - grandTotal;
        const balanceText = difference >= 0
            ? `Change: ${formatCurrency(difference)}`
            : `Balance Due: ${formatCurrency(Math.abs(difference))}`;
        const servicesText = selectedServices.length
            ? selectedServices.map(function (service) { return service.dataset.label; }).join(', ')
            : 'None';

        setSummary('summaryCustomerId', document.getElementById('customerId').value.trim());
        setSummary('summaryName', `${document.getElementById('firstname').value.trim()} ${document.getElementById('lastname').value.trim()}`);
        setSummary('summaryLicense', document.getElementById('license').value.trim());
        setSummary('summaryEmail', document.getElementById('email').value.trim());
        setSummary('summaryPhone', phone.value.trim());
        setSummary('summaryCar', selectedCar.value);
        setSummary('summaryRate', `${formatCurrency(dailyRate)} / day`);
        setSummary('summaryPickupDate', formatDate(pickupDate.value));
        setSummary('summaryReturnDate', formatDate(returnDate.value));
        setSummary('summaryDays', `${rentalDays} day${rentalDays === 1 ? '' : 's'}`);
        setSummary('summaryPickupLocation', document.getElementById('pickupLocation').value);
        setSummary('summaryReturnLocation', document.getElementById('returnLocation').value);
        setSummary('summaryServices', servicesText);
        setSummary('summaryCarCost', formatCurrency(carCost));
        setSummary('summaryServiceCost', formatCurrency(serviceCost));
        setSummary('summaryDiscount', formatCurrency(discount));
        setSummary('summaryTax', formatCurrency(tax));
        setSummary('summaryTotal', formatCurrency(grandTotal));
        setSummary('summaryPaid', formatCurrency(amountPaid));
        setSummary('summaryBalance', balanceText);

        summary.classList.remove('hidden');
        summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
