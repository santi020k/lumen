package com.santi020k.lumen.preview

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenAlert
import com.santi020k.lumen.LumenAlertVariant
import com.santi020k.lumen.LumenAvatar
import com.santi020k.lumen.LumenBadge
import com.santi020k.lumen.LumenBadgeTone
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenCard
import com.santi020k.lumen.LumenCardVariant
import com.santi020k.lumen.LumenProgress
import com.santi020k.lumen.LumenSurface
import com.santi020k.lumen.LumenSurfacePadding
import com.santi020k.lumen.LumenSurfaceRadius
import com.santi020k.lumen.LumenSurfaceTone
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextField
import com.santi020k.lumen.LumenTextTone
import com.santi020k.lumen.LumenTextVariant
import com.santi020k.lumen.LumenTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LumenTheme(darkTheme = false) {
                LumenSurface(
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding()
                        .navigationBarsPadding(),
                    tone = LumenSurfaceTone.Canvas,
                    padding = LumenSurfacePadding.Lg,
                    radius = LumenSurfaceRadius.None
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(18.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                LumenText(
                                    "Jetpack Compose",
                                    variant = LumenTextVariant.Caption,
                                    tone = LumenTextTone.Muted
                                )
                                LumenText("Native component gallery", variant = LumenTextVariant.Title)
                            }
                            LumenBadge("Android", tone = LumenBadgeTone.Success)
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            LumenButton(onClick = {}) { Text("Continue") }
                            LumenButton(onClick = {}, intent = LumenButtonIntent.Secondary) {
                                Text("Later")
                            }
                            LumenButton(onClick = {}, intent = LumenButtonIntent.Danger) {
                                Text("Delete")
                            }
                        }

                        var email by remember { mutableStateOf("santiago@lumen.dev") }
                        LumenTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = "Email address",
                            modifier = Modifier.fillMaxWidth()
                        )

                        LumenCard(
                            modifier = Modifier.fillMaxWidth(),
                            variant = LumenCardVariant.Muted
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                LumenBadge("Active", tone = LumenBadgeTone.Success)
                                LumenText("Team workspace", variant = LumenTextVariant.Label)
                                LumenText(
                                    "Shared tokens with native Compose behavior.",
                                    tone = LumenTextTone.Soft
                                )
                            }
                        }

                        LumenAlert(
                            modifier = Modifier.fillMaxWidth(),
                            variant = LumenAlertVariant.Success
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                LumenText(
                                    "Changes saved",
                                    variant = LumenTextVariant.Label,
                                    tone = LumenTextTone.Success
                                )
                                LumenText("Your preferences are up to date.", tone = LumenTextTone.Soft)
                            }
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                LumenText("Documentation", variant = LumenTextVariant.Label)
                                LumenText(
                                    "68%",
                                    variant = LumenTextVariant.Caption,
                                    tone = LumenTextTone.Muted
                                )
                            }
                            LumenProgress(value = 68f, label = "Documentation progress")
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            LumenAvatar(fallback = "SM", label = "Santiago")
                            Column(modifier = Modifier.weight(1f)) {
                                LumenText("Santiago", variant = LumenTextVariant.Label)
                                LumenText(
                                    "Design systems",
                                    variant = LumenTextVariant.Caption,
                                    tone = LumenTextTone.Muted
                                )
                            }
                            LumenBadge("Admin")
                        }
                    }
                }
            }
        }
    }
}
