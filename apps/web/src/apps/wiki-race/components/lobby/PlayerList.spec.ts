import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerList from './PlayerList.vue';
import { PlayerStatus } from '@wiki-race/shared';
import type { PlayerDTO } from '@wiki-race/shared';

const players: PlayerDTO[] = [
  { pseudo: 'Alice', status: PlayerStatus.CONNECTED, isHost: true },
  { pseudo: 'Bob', status: PlayerStatus.CONNECTED, isHost: false },
  { pseudo: 'Carol', status: PlayerStatus.DISCONNECTED, isHost: false },
];

describe('PlayerList', () => {
  it('renders all players', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Bob');
    expect(wrapper.text()).toContain('Carol');
  });

  it('shows the crown icon for the host', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    const items = wrapper.findAll('li');
    // Alice is host — should have the crown SVG (not the placeholder span)
    const aliceItem = items[0];
    expect(aliceItem.find('svg').exists()).toBe(true);
  });

  it('shows player count in header', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    expect(wrapper.text()).toContain('3/8');
  });

  it('applies disconnected badge style for disconnected players', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    const carolItem = wrapper.findAll('li')[2];
    expect(carolItem.text()).toContain('Déconnecté');
    expect(carolItem.find('.text-amber-700').exists()).toBe(true);
  });

  it('renders empty list gracefully', () => {
    const wrapper = mount(PlayerList, { props: { players: [] } });
    expect(wrapper.text()).toContain('0/8');
  });
});
