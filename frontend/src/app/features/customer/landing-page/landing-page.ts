import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIcon } from '../../../shared/ui';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-screen relative overflow-hidden',
  },
  template: `
    <!-- Background overlay -->
    <div
      class="absolute inset-0 bg-[url('/background.webp')] bg-cover bg-center bg-no-repeat z-0 opacity-60"
    ></div>
    <div class="absolute inset-0 bg-white/60 backdrop-blur-sm z-0"></div>

    <div
      class="relative z-10 flex flex-col items-center justify-between min-h-screen p-4 gap-4 md:gap-8"
    >
      <!-- Header / Logo Area -->
      <div class="text-center shrink-0 flex flex-col items-center gap-4">
        <img
          src="/logo.svg"
          alt="LPU Logo"
          class="w-20 h-20 md:w-32 md:h-32 object-contain drop-shadow-xl"
        />
        <div class="flex flex-col gap-2">
          <h1
            class="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 drop-shadow-sm"
          >
            LYCEUM OF THE PHILIPPINES UNIVERSITY - LAGUNA
          </h1>
          <h2 class="text-sm sm:text-xl md:text-2xl font-light tracking-widest text-gray-700">
            RESERVATION SYSTEM
          </h2>
        </div>
      </div>

      <!-- Facilities Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 max-w-7xl w-full mx-auto flex-1 content-start md:content-stretch"
      >
        <a
          routerLink="#"
          class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-2 md:p-4 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-fit md:h-full"
        >
          <ui-icon
            name="airport_shuttle"
            class="text-3xl md:text-[80px] opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-base md:text-2xl">University Van</span>
        </a>

        <a
          routerLink="#"
          class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-2 md:p-4 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-fit md:h-full"
        >
          <ui-icon
            name="stadium"
            class="text-3xl md:text-[80px] opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-base md:text-2xl">FLT Theater</span>
        </a>

        <a
          routerLink="#"
          class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-2 md:p-4 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-fit md:h-full"
        >
          <ui-icon
            name="sports_basketball"
            class="text-3xl md:text-[80px] opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-base md:text-2xl">Gymnasium</span>
        </a>

        <a
          routerLink="/customer/boardroom"
          class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-2 md:p-4 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-fit md:h-full"
        >
          <ui-icon
            name="groups"
            class="text-3xl md:text-[80px] opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-base md:text-2xl">Boardroom</span>
        </a>

        <a
          routerLink="#"
          class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-2 md:p-4 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-fit md:h-full"
        >
          <ui-icon
            name="co_present"
            class="text-3xl md:text-[80px] opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-base md:text-2xl">Nexus Room</span>
        </a>

        <a
          routerLink="#"
          class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-2 md:p-4 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-fit md:h-full"
        >
          <ui-icon
            name="meeting_room"
            class="text-3xl md:text-[80px] opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <span class="font-bold text-base md:text-2xl">Conference Room</span>
        </a>
      </div>

      <!-- Footer -->
      <div class="shrink-0 pb-4 text-center text-xs text-gray-500 font-medium">
        &copy; 2026 LPU - Laguna. All rights reserved.
      </div>
    </div>
  `,
})
export class LandingPage {}
