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
    <div class="absolute inset-0 bg-[url('/background.webp')] bg-cover bg-center bg-no-repeat z-0 opacity-60"></div>
    <div class="absolute inset-0 bg-white/60 backdrop-blur-sm z-0"></div>

    <div class="relative z-10 flex flex-col items-center justify-between min-h-screen p-6 pt-12">
      <!-- Header / Logo Area -->
      <div class="text-center mb-8 shrink-0">
        <!-- Mock Logo, since we don't have the actual logo asset -->
         <img src="/logo.svg" alt="LPU Laguna" class="w-50 h-50 mx-auto mb-4  text-white  flex items-center justify-center " />
       
        <h1 class="text-3xl md:text-4xl font-black tracking-tight text-gray-900 drop-shadow-sm">LYCEUM OF THE PHILIPPINES UNIVERSITY - LAGUNA</h1>
        <h2 class="text-xl md:text-2xl font-light tracking-widest text-gray-700 mt-2">RESERVATION SYSTEM</h2>
      </div>

      <!-- Facilities Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-7xl w-full mx-auto flex-1 mb-12">
        
        <a routerLink="#" class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col items-center justify-center gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-full">
          <ui-icon name="airport_shuttle" [size]="80" class="opacity-80 group-hover:opacity-100 transition-opacity" />
          <span class="font-bold text-xl md:text-2xl">University Van</span>
        </a>

        <a routerLink="#" class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col items-center justify-center gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-full">
          <ui-icon name="stadium" [size]="80" class="opacity-80 group-hover:opacity-100 transition-opacity" />
          <span class="font-bold text-xl md:text-2xl">FLT Theater</span>
        </a>

        <a routerLink="#" class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col items-center justify-center gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-full">
          <ui-icon name="fitness_center" [size]="80" class="opacity-80 group-hover:opacity-100 transition-opacity" />
          <span class="font-bold text-xl md:text-2xl">Gymnasium</span>
        </a>

        <a routerLink="/book/boardroom" class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col items-center justify-center gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-full">
          <ui-icon name="groups" [size]="80" class="opacity-80 group-hover:opacity-100 transition-opacity" />
          <span class="font-bold text-xl md:text-2xl">Boardroom</span>
        </a>

        <a routerLink="#" class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col items-center justify-center gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-full">
          <ui-icon name="co_present" [size]="80" class="opacity-80 group-hover:opacity-100 transition-opacity" />
          <span class="font-bold text-xl md:text-2xl">Nexus Room</span>
        </a>

        <a routerLink="#" class="surface elevated border-2 border-primary hover:-translate-y-1 transition-all duration-300 rounded-xl p-8 flex flex-col items-center justify-center gap-6 text-black hover:bg-primary hover:text-white cursor-pointer group h-full">
          <ui-icon name="meeting_room" [size]="80" class="opacity-80 group-hover:opacity-100 transition-opacity" />
          <span class="font-bold text-xl md:text-2xl">Conference Room</span>
        </a>

      </div>

      <!-- Footer -->
      <div class="mt-auto shrink-0 pb-4 text-center text-xs text-gray-500 font-medium">
        &copy; 2026 LPU - Laguna. All rights reserved.
      </div>
    </div>
  `,
})
export class LandingPage {}
