const html = require('choo/html');
const assets = require('../../common/assets');
const modal = require('./modal');

module.exports = function(state, emit) {
  return html`
    <main class="main">
      ${state.modal && modal(state, emit)}
      <section
        class="flex flex-col items-center justify-center h-full w-full p-6 md:p-8 overflow-hidden md:rounded-xl md:shadow-big"
      >
        <h1 class="text-center text-3xl font-bold my-2">
          ${state.translate('errorPageHeader')}
        </h1>
        <img class="my-12 h-48" src="${assets.get('error.svg')}" />
        <p class="max-w-md text-center text-grey-80 leading-normal">
          ${state.translate('trySendDescription')}
        </p>
        <p class="my-5">
          <a href="/" class="btn rounded-lg flex items-center" role="button"
            >${state.translate('sendYourFilesLink')}</a
          >
        </p>
      </section>
    </main>
  `;
};
