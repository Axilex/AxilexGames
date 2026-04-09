import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WikiContentArea from './WikiContentArea.vue';

const HTML_WITH_LINKS = `
  <p>La <a href="/wiki/France">France</a> est un pays.</p>
  <p>Sa capitale est <a href="/wiki/Paris">Paris</a>.</p>
  <p><a href="https://example.com">Lien externe</a></p>
  <p><a href="/wiki/Aide:Bienvenue">Page d'aide</a></p>
`;

describe('WikiContentArea', () => {
  it('renders the HTML content', () => {
    const wrapper = mount(WikiContentArea, {
      props: { htmlContent: '<p>Test content</p>' },
    });
    expect(wrapper.text()).toContain('Test content');
  });

  it('emits navigate when a /wiki/ link is clicked', async () => {
    const wrapper = mount(WikiContentArea, {
      props: { htmlContent: HTML_WITH_LINKS },
      attachTo: document.body,
    });

    const link = wrapper.find('a[href="/wiki/France"]');
    await link.trigger('click');

    expect(wrapper.emitted('navigate')).toBeTruthy();
    expect(wrapper.emitted('navigate')![0]).toEqual(['France']);
  });

  it('emits navigate with the correct slug stripping /wiki/', async () => {
    const wrapper = mount(WikiContentArea, {
      props: { htmlContent: HTML_WITH_LINKS },
      attachTo: document.body,
    });

    const link = wrapper.find('a[href="/wiki/Paris"]');
    await link.trigger('click');

    expect(wrapper.emitted('navigate')![0]).toEqual(['Paris']);
  });

  it('does NOT emit navigate for external links', async () => {
    const wrapper = mount(WikiContentArea, {
      props: { htmlContent: HTML_WITH_LINKS },
      attachTo: document.body,
    });

    const externalLink = wrapper.find('a[href="https://example.com"]');
    if (externalLink.exists()) {
      await externalLink.trigger('click');
      // No navigate emit
      expect(wrapper.emitted('navigate')).toBeFalsy();
    }
  });

  it('shows loading overlay when isNavigating is true', () => {
    const wrapper = mount(WikiContentArea, {
      props: { htmlContent: '<p>Content</p>', isNavigating: true },
    });
    expect(wrapper.find('svg.animate-spin').exists()).toBe(true);
  });

  it('hides loading overlay when isNavigating is false', () => {
    const wrapper = mount(WikiContentArea, {
      props: { htmlContent: '<p>Content</p>', isNavigating: false },
    });
    expect(wrapper.find('.bg-gray-900\\/70').exists()).toBe(false);
  });
});
