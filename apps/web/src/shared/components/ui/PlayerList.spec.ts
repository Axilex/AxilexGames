import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { PlayerStatus } from '@wiki-race/shared';
import PlayerList from './PlayerList.vue';

const players = [
  { pseudo: 'Alice', status: PlayerStatus.CONNECTED, isHost: true, score: 5 },
  { pseudo: 'Bob', status: PlayerStatus.CONNECTED, isHost: false, score: 3 },
  { pseudo: 'Carol', status: PlayerStatus.DISCONNECTED, isHost: false, score: 0 },
];

describe('PlayerList (shared)', () => {
  it('renders all players', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Bob');
    expect(wrapper.text()).toContain('Carol');
  });

  it('shows the Hôte badge for the host', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    expect(wrapper.findAll('li')[0].text()).toContain('Hôte');
    expect(wrapper.findAll('li')[1].text()).not.toContain('Hôte');
  });

  it('shows count without max by default', () => {
    const wrapper = mount(PlayerList, { props: { players } });
    expect(wrapper.text()).toContain('Joueurs (3)');
  });

  it('shows count with max when maxPlayers is set', () => {
    const wrapper = mount(PlayerList, { props: { players, maxPlayers: 8 } });
    expect(wrapper.text()).toContain('3/8');
  });

  it('counts only CONNECTED players when countConnectedOnly is true', () => {
    const wrapper = mount(PlayerList, {
      props: { players, maxPlayers: 8, countConnectedOnly: true },
    });
    expect(wrapper.text()).toContain('2/8');
  });

  it('renders empty list gracefully', () => {
    const wrapper = mount(PlayerList, { props: { players: [], maxPlayers: 8 } });
    expect(wrapper.text()).toContain('0/8');
  });

  it('highlights the current player when myPseudo matches', () => {
    const wrapper = mount(PlayerList, { props: { players, myPseudo: 'Bob' } });
    const items = wrapper.findAll('li');
    expect(items[1].classes()).toContain('bg-amber-50');
    expect(items[0].classes()).not.toContain('bg-amber-50');
  });

  it('renders score when showScore is true', () => {
    const wrapper = mount(PlayerList, { props: { players, showScore: true } });
    const aliceItem = wrapper.findAll('li')[0];
    expect(aliceItem.text()).toContain('5');
  });

  it('renders the full status badge when showFullStatus is true', () => {
    const wrapper = mount(PlayerList, { props: { players, showFullStatus: true } });
    const carolItem = wrapper.findAll('li')[2];
    expect(carolItem.text()).toContain('Déconnecté');
    expect(carolItem.find('.text-amber-700').exists()).toBe(true);
  });
});
