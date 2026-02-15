import React from 'react';
import { useProfileStore } from '../store';
import { useT } from '../i18n';

export default function Profile() {
  const t = useT();
  const { fullName, address, phone, notes, setProfile } = useProfileStore();

  const input =
    "w-full px-4 py-3 rounded-xl bg-surface-2 text-text border border-border " +
    "focus:outline-none focus:ring-2 focus:ring-brand-primary";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-brand-primary mb-2">
        {t('profile')}
      </h1>
      <p className="text-text-muted mb-6">{t('profileHint')}</p>

      <div className="lux-card p-6 rounded-2xl">
        <div className="grid gap-4">
          <div>
            <label className="text-text-muted font-semibold">{t('fullName')}</label>
            <input className={input} value={fullName} onChange={(e)=>setProfile({fullName:e.target.value})}/>
          </div>

          <div>
            <label className="text-text-muted font-semibold">{t('address')}</label>
            <input className={input} value={address} onChange={(e)=>setProfile({address:e.target.value})}/>
          </div>

          <div>
            <label className="text-text-muted font-semibold">{t('phone')}</label>
            <input className={input} value={phone} onChange={(e)=>setProfile({phone:e.target.value})}/>
          </div>

          <div>
            <label className="text-text-muted font-semibold">Notes</label>
            <textarea className={input} rows={4} value={notes} onChange={(e)=>setProfile({notes:e.target.value})}/>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary">{t('save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
