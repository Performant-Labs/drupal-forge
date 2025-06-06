if (typeof window.jQuery !== 'undefined') {
  window.$ = window.jQuery;
  console.log('Drupal has loaded jQuery, halilujah');
} else {
  console.log('No goddamn jQuery, you are loser!');
}

$(document).ready(function () {
  // Enable this if you use the `start_test_form`
  // instead of building the form directly in the template,
  // $('#the-button').on('click', function (e) {
  //   e.preventDefault();
  //   invoke();
  // });

  // Fetch logs in case there is run launched from the different browser tab etc.
  fetchLogs();

  $('.js-multiselect').multipleSelect({
    placeholder: 'Select tags...',
    minimumCountSelected: 4,

    // Function to split selected tags into separate spans.
    onClick: function () {
      $('.ms-choice > span').each(function () {
        const $this = $(this);
        const text = $this.text().trim();

        if (text) {
          const tags = text.split(',');
          $this.empty();

          // Create a single wrapper div for all selected tags
          const $wrapperDiv = $('<div>').addClass('tag-wrapper');

          tags.forEach(function (tag) {
            if (tag.trim()) {
              $('<span>')
                .text(tag.trim())
                .addClass('selected-tag')
                .appendTo($wrapperDiv);
            }
          });

          // Append the wrapper div to the parent
          $this.append($wrapperDiv);
        }
      });
    },
  });
});

function $DRAPI(url, init) {
  return $.ajax('/session/token').then((response) => {
    const token = response;
    init ||= {};
    init.headers ||= {};
    init.headers['X-CSRF-Token'] = token;
    return $.ajax(url, init);
  });
}

function disableTheButton(value) {
  $('#the-button').prop('disabled', value).text(value ? 'Running...' : 'Start Tests');
}

function invoke() {
  // disable the button to prevent occasional double-click
  disableTheButton(true);
  // clear previous logs and report link if they exist
  $('#log-content').text('');
  $('#report-link').html('');
  // Hide placeholder text while tests are running
  $('#log-placeholder').css('display', 'none');
  // Scroll to the #test-results section
  document
    .getElementById('test-results')
    .scrollIntoView({ behavior: 'smooth' });

  // form grep as a regex
  const tags = $.map($('#tags :selected'), (e) => e.value);
  const grep = !tags.length ? null : `(${tags.join('|')})`;
  $DRAPI('/pl_drupal_forge/invoke?_format=json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      url: $('[name="url"]').val(),
      grep,
    }),
  })
    .then(() => {
      fetchLogs();
    })
    .catch(onError);
}

let lastTimestamp;

function fetchLogs() {
  let input = '/pl_drupal_forge/logs';
  if (lastTimestamp) {
    input += `?timestamp=${lastTimestamp}`;
  }
  $.ajax(input)
    .then((response) => {
      // automatically parsed by jQuery
      const data = response;
      if (data.status === 'running') {
        $('#log-pane').css('display', 'block');
        setTimeout(fetchLogs, 1000);
      }
      lastTimestamp = data.timestamp;

      if (!data.hasOwnProperty('logs')) {
        // bad bad response... don't know how to handle it...
        return;
      }
      for (const log of data.logs) {
        $('#log-content').append(
          `${new Date(log.timestamp).toLocaleString()}     ${log.message}\n`
        );
        $('#log-pane').scrollTop($('#log-pane').prop('scrollHeight'));
      }

      // If ended, enable the button again.
      if (data.status === 'ended' || data.status === 'timeout') {
        disableTheButton(false);

        // If message is received, collect it.
        if (data.message) {
          let message = data.message;

          if (data.resultUri) {
            // If the message contains a result URI, show an alert.
            showAlert(data.message, data.resultUri);

            // Also add a report link above the log.
            const reportLink = `<a href="${data.resultUri}" target="_blank" class="pl-extlink">View Report <i data-lucide="external-link"></i></a>`;
            $('#report-link').html(reportLink);

            // Ensure Lucide icons are rendered
            lucide.createIcons();
          } else {
            // Otherwise, show the message in the messages list.
            showMessage(message, data.statusCode !== 200);
          }
        }
      }
      if (data.status === 'running') {
        disableTheButton(true);
      }
    })
    .catch(onError);
}

// Function to show an alert message.
function showAlert(messageText, reportLink) {
  Swal.fire({
    title: 'Report is ready',
    titleText: 'Report is ready',
    text: messageText,
    confirmButtonText: `View Report <i data-lucide="external-link"></i>`,
    buttonsStyling: false,
    color: 'var(--pl-neutral-darkest)',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    customClass: {
      popup: 'pl-alert',
      confirmButton:
        'view-report-button pl-button pl-button--lg pl-sp-m-block-lg',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // User clicked the confirm button
      window.open(reportLink, '_blank');
    }
  });
}

// Show message in the messages list.
// if isError is true, add error class.
function showMessage(message, isError = true) {
  const $messages = $('.messages-list');
  $messages.removeClass('hidden');
  const $1 = $(
    `<div class="messages ${
      isError ? 'messages--error' : ''
    }" style="white-space: pre-line;"></div>`
  ).html(message);
  $messages.append($1);
  $messages[0].scrollIntoView();
}

function onError(error) {
  // in case error handle fails, we can see the original object in console.
  console.error(error);

  // Drupal returns response as a piece of HTML, so handle it here
  const message =
    error.responseText ||
    '<strong>Unhandled error. Check out browser console for details.</strong>';
  showMessage(message);
}
