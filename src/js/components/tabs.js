import TabsController from './TabsController';

const tabs = document.querySelectorAll("[data-controller='tabs']");

tabs.forEach(tab => {
  const controller = new TabsController(tab);
  controller.init();
});
