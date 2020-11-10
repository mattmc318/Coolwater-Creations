$(() => {
  // console link
  console.log('This site brought to you by McCarthy Code.');
  console.log('https://mccarthycode.com/');

  // external link icon
  $('a.external-link')
    .after('<i class="fas fa-external-link-alt" title="External Link"></i>');
});