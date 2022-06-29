<template>
  <div class="bodyFontStyle">
    <el-row>
      <el-col :span="12">
        <p>Configuration screen</p>
      </el-col>
      <el-col :span="6" :offset="5">
        <el-button
          icon="el-icon-setting"
          type="primary"
          size="mini"
          v-on:click="closeSettings"
          >Close</el-button
        >
      </el-col>
    </el-row>
    <el-form
      :rules="rules"
      :model="ruleForm"
      ref="ruleForm"
      size="mini"
      class="demo-ruleForm"
    >
      <el-col>
        <el-form-item label="Deepl Api Key" required prop="apiKey">
          <el-input v-model="ruleForm.apiKey"></el-input>
        </el-form-item>
        <el-row>
          <el-form-item
            label="Translation Mode"
            required
            prop="modeOfTranslation"
          ></el-form-item>

          <el-radio
            v-model="ruleForm.modeOfTranslation"
            :label="mode.value"
            v-for="mode in ruleForm.translationModes"
            :key="mode.value"
          >
            {{ mode.label }}
          </el-radio>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit('ruleForm')"
            >Update</el-button
          >
        </el-form-item>
      </el-col>
    </el-form>
  </div>
</template>
<script>
import { Notification } from "element-ui";
import { updateDataSourceEntries } from "../utils/services";
import {
  FIELD_LEVEL,
  FOLDER_LEVEL,
  MODE_INITIAL_VALUE,
  API_KEY_INITIAL_VALUE,
} from "../utils/constants";

export default {
  name: "ConfigurationScreen",
  props: ["deeplKey", "mode", "deeplKeyObj", "modeObj"],
  data() {
    return {
      spaceId: this.$route.query.space_id,

      ruleForm: {
        apiKey: this.deeplKey === API_KEY_INITIAL_VALUE ? "" : this.deeplKey,
        apiKeyObj: this.deeplKeyObj,
        modeOfTranslation: this.mode === MODE_INITIAL_VALUE ? "" : this.mode,
        modeOfTranslationObj: this.modeObj,
        translationModes: [
          { value: FIELD_LEVEL, label: "Field Level" },
          { value: FOLDER_LEVEL, label: "Folder Level" },
        ],
      },
      rules: {
        apiKey: [
          {
            required: true,
            message: "Please input Deepl Api Key",
            trigger: "blur",
          },
        ],
        modeOfTranslation: [
          {
            required: true,
            message: "Please select translation mode",
            trigger: "change",
          },
        ],
      },
    };
  },

  methods: {
    async handleSubmit(form) {
      this.$refs[form].validate(async (valid, fieldErrorObj) => {
        if (valid) {
          const updatedValues = [];

          if (this.ruleForm.apiKey !== this.deeplKey)
            updatedValues.push({
              ...this.ruleForm.apiKeyObj,
              value: this.ruleForm.apiKey,
            });

          if (this.ruleForm.modeOfTranslation !== this.mode)
            updatedValues.push({
              ...this.ruleForm.modeOfTranslationObj,
              value: this.ruleForm.modeOfTranslation,
            });

          updatedValues.forEach(async (datasourceEntry) => {
            let response = await updateDataSourceEntries(
              this.spaceId,
              datasourceEntry
            );

            if (response.status === 204) {
              this.successMessage(datasourceEntry.name);

              if (datasourceEntry.name === "Deepl-Api-key") {
                this.$emit("updateApiKey", {
                  key: this.ruleForm.apiKey,
                  obj: this.ruleForm.apiKeyObj,
                });
              } else {
                this.$emit("updateTranslationMode", {
                  mode: this.ruleForm.modeOfTranslation,
                  obj: this.ruleForm.modeOfTranslationObj,
                });
              }
            } else this.errorMessage();
          });
        } else {
          console.log("error submit!!", fieldErrorObj);
          return false;
        }
      });
    },

    closeSettings() {
      this.$emit("close");
    },

    successMessage(dataSource) {
      Notification({
        title: "Success",
        message: `${dataSource} updated successfully!`,
        type: "success",
      });
    },
    errorMessage(_message) {
      Notification({
        title: "Error",
        message: _message ?? "Something went wrong, try again later.",
        type: "error",
      });
    },
  },
};
</script>

<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.bodyFontStyle {
  font-family: sans-serif;
}
.el-notification__title {
  font-weight: 700;
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-family: sans-serif;
}
.el-notification__content {
  font-size: 14px;
  line-height: 21px;
  margin: 6px 0 0;
  color: #606266;
  text-align: justify;
  font-family: sans-serif;
}
.el-notification {
  display: flex;
  width: 270px;
  padding: 14px 26px 14px 13px;
  border-radius: 8px;
  box-sizing: border-box;
  border: 1px solid #ebeef5;
  position: fixed;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  transition: opacity 0.3s, transform 0.3s, left 0.3s, right 0.3s, top 0.4s,
    bottom 0.3s;
  overflow: hidden;
}
p {
  font-size: 14px;
  color: #606266;
}
.error-text {
  color: #f56c6c;
  font-weight: bold;
}
</style>
