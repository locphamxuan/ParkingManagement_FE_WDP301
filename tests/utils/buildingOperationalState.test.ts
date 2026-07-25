import { describe, expect, it } from 'vitest';
import {
  BUILDING_STATE_LABELS,
  isOperationalNow,
  resolveBuildingOperationalState,
} from '@/utils/buildingOperationalState';

const VN = 'Asia/Ho_Chi_Minh';
const at = (vnDateTime: string) => new Date(`${vnDateTime}+07:00`);
const DAY = '2026-07-01T';

const state = (
  status: string | null | undefined,
  hours: { open?: string | null; close?: string | null } | null | undefined,
  vnTime: string,
) => resolveBuildingOperationalState(status, hours, at(`${DAY}${vnTime}`), VN);

const DAY_HOURS = { open: '06:00', close: '22:00' };

describe('resolveBuildingOperationalState', () => {
  it('shows an active building as open inside its operating window', () => {
    expect(state('active', DAY_HOURS, '06:00')).toBe('open');
    expect(state('active', DAY_HOURS, '12:00')).toBe('open');
    expect(state('active', DAY_HOURS, '21:59')).toBe('open');
  });

  it('shows an active building as closed outside its operating window', () => {
    // Bug gốc: 06:00–22:00 vẫn hiện ACTIVE xanh lúc 00:00.
    expect(state('active', DAY_HOURS, '00:00')).toBe('closed');
    expect(state('active', DAY_HOURS, '00:08')).toBe('closed');
    expect(state('active', DAY_HOURS, '05:59')).toBe('closed');
    expect(state('active', DAY_HOURS, '22:00')).toBe('closed');
    expect(state('active', DAY_HOURS, '23:30')).toBe('closed');
  });

  it('supports overnight windows', () => {
    const overnight = { open: '22:00', close: '06:00' };

    expect(state('active', overnight, '00:08')).toBe('open');
    expect(state('active', overnight, '23:00')).toBe('open');
    expect(state('active', overnight, '05:59')).toBe('open');
    expect(state('active', overnight, '06:00')).toBe('closed');
    expect(state('active', overnight, '12:00')).toBe('closed');
  });

  it('lets the administrative status win over operating hours', () => {
    // Kể cả đang trong giờ mở cửa.
    expect(state('maintenance', DAY_HOURS, '12:00')).toBe('maintenance');
    expect(state('inactive', DAY_HOURS, '12:00')).toBe('inactive');
    // Và cả ngoài giờ mở cửa.
    expect(state('maintenance', DAY_HOURS, '00:08')).toBe('maintenance');
    expect(state('inactive', DAY_HOURS, '00:08')).toBe('inactive');
  });

  it('treats an active building without operating hours as 24/7 open', () => {
    expect(state('active', undefined, '00:08')).toBe('open');
    expect(state('active', null, '03:00')).toBe('open');
    expect(state('active', {}, '03:00')).toBe('open');
    expect(state('active', { open: '', close: '' }, '03:00')).toBe('open');
  });

  it('never shows malformed operating hours as open', () => {
    expect(state('active', { open: '08:00', close: '08:00' }, '12:00')).toBe('closed');
    expect(state('active', { open: '25:00', close: '22:00' }, '12:00')).toBe('closed');
    expect(state('active', { open: '6:0', close: '22:00' }, '12:00')).toBe('closed');
    // Chỉ thiếu một nửa cấu hình → không phải 24/7, coi như đóng.
    expect(state('active', { open: '06:00' }, '12:00')).toBe('closed');
    expect(state('active', { close: '22:00' }, '12:00')).toBe('closed');
  });

  it('falls back to inactive for unknown administrative statuses', () => {
    expect(state('archived', DAY_HOURS, '12:00')).toBe('inactive');
    expect(state(undefined, DAY_HOURS, '12:00')).toBe('inactive');
  });

  it('keys off the business timezone, not the device timezone', () => {
    // 2026-07-01T23:30:00Z = 06:30 ngày 02/07 giờ VN → đã mở cửa.
    const instant = new Date('2026-07-01T23:30:00Z');

    expect(resolveBuildingOperationalState('active', DAY_HOURS, instant, VN)).toBe('open');
    expect(resolveBuildingOperationalState('active', DAY_HOURS, instant, 'UTC')).toBe('closed');
  });

  it('reserves the operational (green/pulsing) treatment for open only', () => {
    expect(isOperationalNow('open')).toBe(true);
    expect(isOperationalNow('closed')).toBe(false);
    expect(isOperationalNow('maintenance')).toBe(false);
    expect(isOperationalNow('inactive')).toBe(false);
  });

  it('labels every state', () => {
    expect(BUILDING_STATE_LABELS.open).toBe('Open');
    expect(BUILDING_STATE_LABELS.closed).toBe('Closed');
    expect(BUILDING_STATE_LABELS.maintenance).toBe('Maintenance');
    expect(BUILDING_STATE_LABELS.inactive).toBe('Paused');
  });
});
